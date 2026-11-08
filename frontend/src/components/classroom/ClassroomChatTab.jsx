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
  return (
    <div>
      <div className="members-toolbar" style={{ marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
            💬 Phòng chat nhóm lớp học
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Kênh trao đổi học tập trực tiếp giữa Gia sư và toàn thể học sinh, phụ huynh lớp <strong>{classroom.name}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-outline-gray"
            style={{ fontSize: '13px', padding: '7px 12px' }}
            onClick={() => setShowChatMembers(!showChatMembers)}
          >
            👥 {showChatMembers ? 'Ẩn thành viên' : `Thành viên (${chatGroupMembers.length})`}
          </button>

          {isOwner && (
            <button
              type="button"
              className="btn-primary-orange"
              style={{ fontSize: '13px', padding: '7px 12px' }}
              onClick={onOpenAddMember}
              title="Thêm thành viên vào lớp và nhóm chat"
            >
              <span>➕</span> Thêm vào nhóm
            </button>
          )}
        </div>
      </div>

      <div className="chat-box-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="chat-messages-area" style={{ flex: 1 }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8' }}>
                👋 Chưa có tin nhắn nào trong nhóm chat lớp. Hãy gửi lời chào đầu tiên!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine =
                  (msg.sender_user_id?._id || msg.sender_user_id) === classroom?.current_user_id;
                const senderName = isMine ? 'Bạn' : msg.sender_user_id?.full_name || 'Thành viên';
                const roleBadge =
                  msg.sender_user_id?.role === 'TUTOR'
                    ? '👨‍🏫 Gia sư'
                    : msg.sender_user_id?.role === 'PARENT'
                    ? '👨‍👩‍👧 Phụ huynh'
                    : '🎒 Học sinh';

                return (
                  <div key={msg._id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    <div className="chat-bubble-author">
                      {senderName} {!isMine && <span style={{ fontWeight: 400, opacity: 0.85 }}>({roleBadge})</span>}
                    </div>
                    <div>{msg.content}</div>
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
                  Thành viên ({chatGroupMembers.length})
                </h4>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>● Đang hoạt động</span>
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
                        {m.is_owner ? '👨‍🏫 Gia sư chủ nhóm' : m.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎒 Học sinh'}
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
                          fontSize: '12px',
                          padding: '2px 4px',
                        }}
                        title="Xóa thành viên khỏi nhóm chat"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form className="chat-input-bar" onSubmit={onSendChat}>
          <input
            type="text"
            className="chat-input-field"
            placeholder="Nhập tin nhắn gửi đến cả lớp..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary-orange"
            style={{ padding: '8px 18px' }}
            disabled={sendingChat || !chatInput.trim()}
          >
            {sendingChat ? 'Đang gửi...' : 'Gửi'}
          </button>
        </form>
      </div>
    </div>
  );
}
