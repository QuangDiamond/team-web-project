// Quét nhanh các trang theo từng vai trò để bắt lỗi chỉ xảy ra khi mở trang (crash lúc render, lỗi JS).
// Đăng nhập từng role, bắt đầu từ dashboard rồi lần theo các link nội bộ trên trang (chỉ mở trang, không bấm nút).
// Cần backend + frontend đang chạy. Chạy: npm run smoke (ở thư mục gốc). Xem scripts/README.md.
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.SMOKE_API_URL || 'http://localhost:9999/api';
const MAX_PAGES_PER_ROLE = Number(process.env.SMOKE_MAX_PAGES || 80);

// Mặc định là tài khoản dữ liệu mẫu dev (docs/marketplace-seed.md, npm run seed:admin). Seed chưa có học sinh nên cần tự đặt.
const ROLES = [
  { role: 'GUEST', startPath: '/' },
  { role: 'STUDENT', startPath: '/student/dashboard' },
  { role: 'PARENT', startPath: '/parent/dashboard', email: 'demo.parent01@example.com', password: 'Abc123456!' },
  { role: 'TUTOR', startPath: '/tutor/dashboard', email: 'demo.tutor01@example.com', password: 'Abc123456!' },
  { role: 'ADMIN', startPath: '/admin/dashboard', email: 'admin@example.com', password: 'Admin@1234' },
];

// Lỗi mạng (4xx/5xx) đã được trang tự xử lý nên không tính là trang hỏng
const IGNORED_CONSOLE_PATTERN = /Failed to load resource/;

// Gọn lỗi về 1 dòng: bỏ placeholder %s / %o của console và stack nhiều dòng
const toOneLine = (text) => text.replace(/%[so]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);

// Các trang chi tiết khác id coi như một trang: /tutor/classes/abc... và /tutor/classes/def... chỉ mở một lần
const toRoutePattern = (pathname) => pathname.replace(/[0-9a-f]{24}/gi, ':id');

const getAccount = (roleConfig) => {
  const email = process.env[`SMOKE_${roleConfig.role}_EMAIL`] || roleConfig.email;
  const password = process.env[`SMOKE_${roleConfig.role}_PASSWORD`] || roleConfig.password;
  if (!email || !password) {
    return null;
  }
  return { email, password };
};

const collectInternalLinks = async (page) => {
  const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((anchor) => anchor.getAttribute('href')));
  const pathnames = [];
  for (const href of hrefs) {
    const isInternal = href && href.startsWith('/') && !href.startsWith('//');
    if (isInternal) {
      pathnames.push(new URL(href, BASE_URL).pathname);
    }
  }
  return pathnames;
};

/**
 * Mở một trang và gom lỗi: lỗi JS chưa bắt, console.error, hoặc trang lỗi của router
 * @returns {Promise<{ errors: string[], links: string[] }>}
 */
const checkPage = async (page, pathname) => {
  // Set để một lỗi bị log nhiều lần (React + router) chỉ in một lần
  const errors = new Set();
  const onPageError = (error) => errors.add(`pageerror: ${toOneLine(error.message)}`);
  const onConsole = (message) => {
    if (message.type() === 'error' && !IGNORED_CONSOLE_PATTERN.test(message.text())) {
      errors.add(`console.error: ${toOneLine(message.text())}`);
    }
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    await page.goto(`${BASE_URL}${pathname}`, { waitUntil: 'load', timeout: 20000 });
    // Chờ các API gọi lúc mở trang trả về và trang render xong
    await page.waitForTimeout(1500);
    const routeErrorCount = await page.locator('[data-route-error]').count();
    const unexpectedErrorCount = await page.getByText('Unexpected Application Error').count();
    if (routeErrorCount > 0 || unexpectedErrorCount > 0) {
      errors.add('Trang hiện màn lỗi của router (component bị crash khi render)');
    }
  } catch (error) {
    errors.add(`không mở được trang: ${error.message.split('\n')[0]}`);
  }

  page.off('pageerror', onPageError);
  page.off('console', onConsole);

  let links = [];
  if (errors.size === 0) {
    links = await collectInternalLinks(page);
  }
  return { errors: [...errors], links };
};

const crawlRole = async (browser, roleConfig) => {
  const context = await browser.newContext();
  const result = { role: roleConfig.role, visited: 0, failures: [], skipped: '' };

  if (roleConfig.role !== 'GUEST') {
    const account = getAccount(roleConfig);
    if (!account) {
      result.skipped = `chưa đặt SMOKE_${roleConfig.role}_EMAIL / SMOKE_${roleConfig.role}_PASSWORD`;
      await context.close();
      return result;
    }
    // Cookie đăng nhập (httpOnly) được lưu vào context nên các trang mở sau đều đã đăng nhập
    const loginResponse = await context.request.post(`${API_URL}/auth/v1/login`, { data: account });
    if (!loginResponse.ok()) {
      result.skipped = `đăng nhập ${account.email} thất bại (HTTP ${loginResponse.status()})`;
      await context.close();
      return result;
    }
  }

  const page = await context.newPage();
  const queue = [roleConfig.startPath];
  const seenPatterns = new Set([toRoutePattern(roleConfig.startPath)]);

  while (queue.length > 0 && result.visited < MAX_PAGES_PER_ROLE) {
    const pathname = queue.shift();
    const { errors, links } = await checkPage(page, pathname);
    result.visited += 1;
    if (errors.length > 0) {
      result.failures.push({ pathname, errors });
    }
    for (const link of links) {
      const pattern = toRoutePattern(link);
      if (!seenPatterns.has(pattern)) {
        seenPatterns.add(pattern);
        queue.push(link);
      }
    }
  }

  await context.close();
  return result;
};

const main = async () => {
  const browser = await chromium.launch({ channel: process.env.SMOKE_BROWSER_CHANNEL || 'chrome' });
  const results = [];
  for (const roleConfig of ROLES) {
    console.log(`[smoke] ${roleConfig.role}...`);
    results.push(await crawlRole(browser, roleConfig));
  }
  await browser.close();

  let failureCount = 0;
  for (const result of results) {
    if (result.skipped) {
      console.log(`\n${result.role}: BỎ QUA (${result.skipped})`);
      continue;
    }
    console.log(`\n${result.role}: đã mở ${result.visited} trang, ${result.failures.length} trang lỗi`);
    for (const failure of result.failures) {
      failureCount += 1;
      console.log(`  ✗ ${failure.pathname}`);
      for (const error of failure.errors) {
        console.log(`      ${error}`);
      }
    }
  }

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

main();
