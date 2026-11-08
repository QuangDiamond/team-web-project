import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

test('schedule helpers format, parse and reject invalid times', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'js', contents: `
      import assert from 'node:assert/strict';
      import { formatSchedule, parseSchedule } from './src/utils/schedule.js';
      import { toSelectOptions } from './src/utils/selectOptions.js';
      import { GRADE_LEVELS } from './src/constants/gradeLevels.js';

      const time = (hour, minute, period) => ({ hour, minute, period });

      // Ngày luôn theo thứ tự trong tuần, phút luôn 2 chữ số
      const text = formatSchedule(['Fri', 'Mon', 'Wed'], time('4', '0', 'PM'), time('6', '30', 'PM'));
      assert.equal(text, 'Mon, Wed, Fri · 4:00 PM - 6:30 PM');
      assert.deepEqual(parseSchedule(text), {
        days: ['Mon', 'Wed', 'Fri'],
        start: time('4', '00', 'PM'),
        end: time('6', '30', 'PM'),
      });

      // Chưa đủ hoặc không hợp lệ thì trả chuỗi rỗng
      assert.equal(formatSchedule([], time('4', '0', 'PM'), time('6', '0', 'PM')), '');
      assert.equal(formatSchedule(['Mon'], time('', '', 'PM'), time('6', '0', 'PM')), '');
      assert.equal(formatSchedule(['Mon'], time('13', '0', 'AM'), time('2', '0', 'PM')), '');
      assert.equal(formatSchedule(['Mon'], time('4', '60', 'AM'), time('5', '0', 'AM')), '');
      assert.equal(formatSchedule(['Mon'], time('6', '0', 'PM'), time('6', '0', 'PM')), '');
      assert.equal(formatSchedule(['Mon'], time('7', '0', 'PM'), time('6', '0', 'PM')), '');

      // 12 AM là nửa đêm, 12 PM là buổi trưa
      assert.equal(formatSchedule(['Sun'], time('12', '0', 'AM'), time('1', '5', 'AM')), 'Sun · 12:00 AM - 1:05 AM');
      assert.equal(formatSchedule(['Sun'], time('12', '0', 'PM'), time('1', '0', 'PM')), 'Sun · 12:00 PM - 1:00 PM');
      assert.equal(formatSchedule(['Sun'], time('11', '0', 'AM'), time('12', '0', 'PM')), 'Sun · 11:00 AM - 12:00 PM');

      // Lịch nhập tay kiểu cũ không đọc được
      assert.equal(parseSchedule('Tối thứ 3, thứ 5'), null);
      assert.equal(parseSchedule(''), null);

      // Lớp 1 đến 12, giá trị cũ ngoài danh sách vẫn được giữ trong options
      assert.equal(GRADE_LEVELS.length, 12);
      assert.equal(GRADE_LEVELS[0], 'Lớp 1');
      assert.equal(GRADE_LEVELS[11], 'Lớp 12');
      assert.deepEqual(toSelectOptions(['Toán'], 'Python').map((option) => option.value), ['Python', 'Toán']);
      assert.deepEqual(toSelectOptions(['Toán'], 'Toán').map((option) => option.value), ['Toán']);
      assert.deepEqual(toSelectOptions(['Toán'], '').map((option) => option.value), ['Toán']);
    ` },
    bundle: true, platform: 'node', format: 'cjs', write: false,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});

test('schedule picker shows the saved schedule and explains an old free-text one', async () => {
  const compiled = await build({
    stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
      import assert from 'node:assert/strict';
      import { renderToStaticMarkup } from 'react-dom/server';
      import SchedulePicker from './src/components/common/SchedulePicker.jsx';

      const saved = renderToStaticMarkup(
        <SchedulePicker id="schedule" label="Schedule" value="Mon, Wed · 4:00 PM - 6:30 PM" onChange={() => {}} />
      );
      assert.equal((saved.match(/class="schedule-day is-selected"/g) || []).length, 2);
      assert.equal((saved.match(/class="schedule-day"/g) || []).length, 5);
      assert.match(saved, /id="schedule"/);
      assert.match(saved, /value="4"/);
      assert.match(saved, /value="30"/);
      assert.doesNotMatch(saved, /Previous schedule/);

      const legacy = renderToStaticMarkup(
        <SchedulePicker id="schedule" label="Schedule" value="Tối thứ 3, thứ 5" onChange={() => {}} />
      );
      assert.equal((legacy.match(/is-selected/g) || []).length, 0);
      assert.match(legacy, /Previous schedule: Tối thứ 3, thứ 5/);

      const withError = renderToStaticMarkup(
        <SchedulePicker id="schedule" label="Schedule" value="" error="Pick a day" onChange={() => {}} />
      );
      assert.match(withError, /Pick a day/);

      const wrongOrder = renderToStaticMarkup(
        <SchedulePicker id="schedule" label="Schedule" value="" onChange={() => {}} />
      );
      assert.doesNotMatch(wrongOrder, /End time must be after start time/);
    ` },
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
});
