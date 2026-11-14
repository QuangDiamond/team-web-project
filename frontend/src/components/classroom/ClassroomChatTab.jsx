import { toast } from 'sonner';
import { useState, useRef } from 'react';
import {
  MessageSquare,
  Users,
  UserPlus,
  Paperclip,
  Send,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  X,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'mp4',
  'zip',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function ClassroomChatTab({
  classroom,
  chatMessages,
  chatGroupMembers,
  showChatMembers,
  setShowChatMembers,
  chatInput,
  setChatInput,
  sendingChat,
  onSendChat,
  onOpenAddMember,
  onSelectRemoveMember,
  chatBottomRef,
  isOwner,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const backendHost = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999/api'
  ).replace(/\/api\/?$/, '');

  const getAttachmentUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isImageAttachment = (att) => {
    if (att.mime_type?.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png)$/i.test(att.file_name || '');
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(
          `Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận các định dạng: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip.`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Tệp "${file.name}" vượt quá dung lượng tối đa cho phép là 20MB.`);
        continue;
      }
      try {
        const base64 = await readFileAsBase64(file);
        validFiles.push({
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || `application/${ext}`,
          file_data: base64,
        });
      } catch {
        toast.error(`Không thể đọc tệp "${file.name}". Vui lòng thử lại.`);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && selectedFiles.length === 0) return;

    const filesToSend = [...selectedFiles];
    const success = await onSendChat(e, filesToSend);
    if (success !== false) {
      setSelectedFiles([]);
    }
  };

  return (
    <div>
      <div className="members-toolbar" style={{ marginBottom: '16px' }}>
        <div>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={20} style={{ color: '#e85a2c' }} />
            Phòng chat nhóm lớp học
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Kênh trao đổi học tập trực tiếp giữa Gia sư và toàn thể học sinh, phụ huynh lớp{' '}
            <strong>{classroom.name}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-outline-gray"
            style={{
              fontSize: '13px',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => setShowChatMembers(!showChatMembers)}
          >
            <Users size={14} />
            {showChatMembers ? 'Ẩn thành viên' : 'Thành viên'}
          </button>

          {isOwner && (
            <button
              type="button"
              className="btn-primary-orange"
              style={{
                fontSize: '13px',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={onOpenAddMember}
              title="Thêm thành viên vào lớp và nhóm chat"
            >
              <UserPlus size={14} />
              Thêm vào nhóm
            </button>
          )}
        </div>
      </div>

      <div className="chat-box-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="chat-messages-area" style={{ flex: 1 }}>
            {chatMessages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  margin: 'auto',
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MessageSquare size={32} style={{ color: '#cbd5e1' }} />
                <span>Chưa có tin nhắn nào trong nhóm chat lớp. Hãy gửi tin nhắn hoặc tài liệu đầu tiên!</span>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine =
                  (msg.sender_user_id?._id || msg.sender_user_id) === classroom?.current_user_id;
                const senderName = isMine ? 'Bạn' : msg.sender_user_id?.full_name || 'Thành viên';
                const roleBadge =
                  msg.sender_user_id?.role === 'TUTOR'
                    ? 'Gia sư'
                    : msg.sender_user_id?.role === 'PARENT'
                    ? 'Phụ huynh'
                    : 'Học sinh';

                return (
                  <div key={msg._id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    <div className="chat-bubble-author">
                      {senderName}{' '}
                      {!isMine && <span style={{ fontWeight: 400, opacity: 0.85 }}>({roleBadge})</span>}
                    </div>

                    {msg.content && <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>}

                    {/* Hiển thị các tệp đính kèm trong tin nhắn */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {msg.attachments.map((att, attIdx) => {
                          const fileUrl = getAttachmentUrl(att.file_url);
                          const isImg = isImageAttachment(att);

                          if (isImg) {
                            return (
                              <div key={attIdx} className="chat-attachment-image-wrap">
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={fileUrl}
                                    alt={att.file_name || 'Ảnh đính kèm'}
                                    style={{
                                      display: 'block',
                                      maxWidth: '260px',
                                      maxHeight: '200px',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </a>
                              </div>
                            );
                          }

                          return (
                            <a
                              key={attIdx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={att.file_name}
                              className="chat-attachment-file-card"
                              title="Tải về tệp đính kèm"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <FileText size={16} />
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontWeight: 600 }}>{att.file_name}</div>
                                  <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                    {formatFileSize(att.file_size)}
                                  </div>
                                </div>
                              </div>
                              <Download size={14} style={{ flexShrink: 0 }} />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '10px',
                        color: isMine ? '#ffedd5' : '#94a3b8',
                        marginTop: '4px',
                        textAlign: 'right',
                      }}
                    >
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Sidebar danh sách thành viên nhóm chat */}
          {showChatMembers && (
            <div
              style={{
                width: '260px',
                borderLeft: '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '14px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                  Thành viên
                </h4>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                  ● Đang hoạt động
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chatGroupMembers.map((m, idx) => (
                  <div
                    key={m.member_id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: '#0f172a',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.user?.full_name || m.user?.email || 'Người dùng'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {m.is_owner
                          ? 'Gia sư chủ nhóm'
                          : m.role === 'PARENT'
                          ? 'Phụ huynh'
                          : 'Học sinh'}
                      </div>
                    </div>

                    {isOwner && !m.is_owner && (
                      <button
                        type="button"
                        onClick={() => onSelectRemoveMember(m)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Xóa thành viên khỏi nhóm chat"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thanh đính kèm tệp đã chọn trước khi gửi */}
        {selectedFiles.length > 0 && (
          <div className="chat-preview-files-bar">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="chat-preview-file-tag">
                {isImageAttachment(file) ? <ImageIcon size={14} /> : <FileText size={14} />}
                <span className="chat-preview-file-name">{file.file_name}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  ({formatFileSize(file.file_size)})
                </span>
                <button
                  type="button"
                  className="chat-preview-file-remove"
                  onClick={() => handleRemoveSelectedFile(idx)}
                  title="Xóa tệp đính kèm này"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Thanh nhập tin nhắn và nút đính kèm tệp */}
        <form className="chat-input-bar" onSubmit={handleSubmit}>
          {/* Nút chọn tệp đính kèm */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.zip"
            multiple
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="btn-outline-gray"
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: selectedFiles.length > 0 ? '#e85a2c' : '#64748b',
              borderColor: selectedFiles.length > 0 ? '#e85a2c' : '#cbd5e1',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm tệp (PDF, Word, Excel, PowerPoint, Ảnh, Video, Zip - tối đa 20MB)"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            className="chat-input-field"
            placeholder={
              selectedFiles.length > 0
                ? 'Nhập lời nhắn kèm tệp (hoặc bấm Gửi ngay)...'
                : 'Nhập tin nhắn gửi đến cả lớp...'
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button
            type="submit"
            className="btn-primary-orange"
            style={{
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            disabled={sendingChat || (!chatInput.trim() && selectedFiles.length === 0)}
          >
            <Send size={15} />
            <span>{sendingChat ? 'Đang gửi...' : 'Gửi'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
