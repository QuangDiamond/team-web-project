import { useCallback, useEffect, useRef, useState } from 'react';
import { getConversation, getMessages, markConversationRead, sendMessage } from '../services/chatService.js';
import { usePolling } from './usePolling.js';

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 4000;

const INITIAL_STATE = { loading: true, error: null, messages: [], pagesLoaded: 0, totalPages: 0 };

// Gộp tin mới vào danh sách đang có: bỏ trùng theo _id, sắp xếp CŨ → MỚI (API trả mới nhất trước)
const mergeMessages = (existing, incoming) => {
  const byId = new Map();
  for (const message of existing) {
    byId.set(message._id, message);
  }
  for (const message of incoming) {
    byId.set(message._id, message);
  }
  const merged = Array.from(byId.values());
  merged.sort((first, second) => {
    const timeDifference = new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    if (timeDifference !== 0) {
      return timeDifference;
    }
    return first._id.localeCompare(second._id);
  });
  return merged;
};

/*
 * Khung chat của một hội thoại: tải tin mới nhất, tự làm mới (polling), tải tin cũ hơn, gửi tin.
 * onActivity: gọi khi có thay đổi ảnh hưởng danh sách hội thoại (đã đọc, vừa gửi) để danh sách làm mới.
 */
export function useChatThread(conversationId, onActivity) {
  const [state, setState] = useState(INITIAL_STATE);
  const [conversation, setConversation] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const lastMarkedIncomingId = useRef(null);

  // Khi chuyển sang hội thoại khác thì bắt đầu lại từ đầu
  useEffect(() => {
    setState(INITIAL_STATE);
    setConversation(null);
    lastMarkedIncomingId.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }
    let ignore = false;
    getConversation(conversationId)
      .then((response) => {
        if (!ignore) {
          setConversation(response.data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState((previous) => ({ ...previous, loading: false, error: error }));
        }
      });
    return () => {
      ignore = true;
    };
  }, [conversationId]);

  // Đánh dấu đã đọc khi có tin mới của người kia mà mình chưa đánh dấu
  const markReadIfNeeded = useCallback(
    async (messages) => {
      const incoming = messages.filter((message) => !message.sender_is_me);
      if (incoming.length === 0) {
        return;
      }
      const newestIncomingId = incoming[incoming.length - 1]._id;
      if (newestIncomingId === lastMarkedIncomingId.current) {
        return;
      }
      lastMarkedIncomingId.current = newestIncomingId;
      try {
        await markConversationRead(conversationId);
        if (onActivity) {
          onActivity();
        }
      } catch (error) {
        // Đánh dấu đã đọc lỗi không ảnh hưởng việc đọc tin; lần polling sau sẽ thử lại
        lastMarkedIncomingId.current = null;
      }
    },
    [conversationId, onActivity]
  );

  const loadLatest = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    try {
      const response = await getMessages(conversationId, { page: 1, limit: PAGE_SIZE });
      const { items, pagination } = response.data;
      setState((previous) => {
        const merged = mergeMessages(previous.messages, items);
        let pagesLoaded = previous.pagesLoaded;
        if (pagesLoaded === 0) {
          pagesLoaded = 1;
        }
        return { loading: false, error: null, messages: merged, pagesLoaded: pagesLoaded, totalPages: pagination.totalPages };
      });
      markReadIfNeeded(mergeMessages([], items));
    } catch (error) {
      setState((previous) => {
        if (previous.messages.length > 0) {
          return previous;
        }
        return { ...previous, loading: false, error: error };
      });
    }
  }, [conversationId, markReadIfNeeded]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  usePolling(loadLatest, POLL_INTERVAL_MS, Boolean(conversationId));

  const loadOlder = async () => {
    if (loadingOlder || state.pagesLoaded >= state.totalPages) {
      return;
    }
    setLoadingOlder(true);
    try {
      const nextPage = state.pagesLoaded + 1;
      const response = await getMessages(conversationId, { page: nextPage, limit: PAGE_SIZE });
      setState((previous) => ({
        ...previous,
        messages: mergeMessages(previous.messages, response.data.items),
        pagesLoaded: nextPage,
        totalPages: response.data.pagination.totalPages,
      }));
    } finally {
      setLoadingOlder(false);
    }
  };

  // Ném lỗi lên cho khung nhập hiển thị; thành công thì thêm tin vừa gửi vào cuối
  const send = async (content) => {
    setSending(true);
    try {
      const response = await sendMessage(conversationId, content);
      setState((previous) => ({ ...previous, messages: mergeMessages(previous.messages, [response.data]) }));
      if (onActivity) {
        onActivity();
      }
    } finally {
      setSending(false);
    }
  };

  const hasOlder = state.pagesLoaded > 0 && state.pagesLoaded < state.totalPages;

  return {
    loading: state.loading,
    error: state.error,
    messages: state.messages,
    conversation,
    hasOlder,
    loadingOlder,
    sending,
    loadOlder,
    send,
  };
}
