import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Pencil, Plus, Trash2, Upload, Sparkles } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Modal from '../common/Modal';
import Alert from '../common/Alert';

const MATERIAL_TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Tài liệu (Document)' },
  { value: 'SLIDE', label: 'Bài giảng / Slide' },
  { value: 'VIDEO', label: 'Video bài giảng' },
  { value: 'LINK', label: 'Liên kết web (Link)' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL_MEMBERS', label: 'Tất cả thành viên trong lớp' },
  { value: 'STUDENTS_ONLY', label: 'Chỉ học sinh' },
];

const ALLOWED_FILE_MIME_TYPES = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/octet-stream'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  ppt: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream'],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
  jpg: ['image/jpeg'],
  png: ['image/png'],
  mp4: ['video/mp4', 'application/octet-stream'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
};

const MAX_CLASS_MATERIAL_SIZE = 20 * 1024 * 1024;

const formatFileSize = (fileSize) => {
  if (!fileSize) return 'Không rõ dung lượng';
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const MATERIAL_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4,.zip';

const MATERIAL_FILE_HELP = 'Định dạng hỗ trợ: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip. Dung lượng tối đa 20 MB.';

const MATERIAL_TYPE_HELP = 'Chọn Liên kết để lưu địa chỉ URL, hoặc chọn danh mục để tải tệp lên.';

const MATERIAL_TYPE_PLACEHOLDER = 'Chọn loại tài liệu';

const MATERIAL_VISIBILITY_PLACEHOLDER = 'Chọn đối tượng được xem tài liệu';

const MATERIAL_TOPIC_NONE = { value: '', label: 'Không thuộc chủ đề nào' };

const materialTopicOptions = (topics) => [MATERIAL_TOPIC_NONE, ...topics.map((topic) => ({
  value: topic._id,
  label: topic.name,
}))];

function CreateMaterialModal({ onClose, onCreate, onUpdate, topics, material }) {
  const [title, setTitle] = useState(material ? material.title : '');
  const [materialType, setMaterialType] = useState(material ? material.material_type : '');
  const [topicId, setTopicId] = useState(material && material.topic_id ? material.topic_id : '');
  const [visibility, setVisibility] = useState(material ? material.visibility : '');
  const [fileUrl, setFileUrl] = useState(material && material.material_type === 'LINK' ? material.file_url : '');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    setFileError('');
    setFile(selectedFile || null);
    if (!selectedFile) return;

    const fileNameParts = selectedFile.name.toLowerCase().split('.');
    const extension = fileNameParts[fileNameParts.length - 1];
    const allowedMimeTypes = ALLOWED_FILE_MIME_TYPES[extension];
    if (!allowedMimeTypes || (selectedFile.type && !allowedMimeTypes.includes(selectedFile.type))) {
      setFileError('Định dạng file không được hỗ trợ. Vui lòng chọn một định dạng trong danh sách bên dưới.');
      setFile(null);
      event.target.value = '';
      return;
    }

    if (selectedFile.size === 0) {
      setFileError('File đã chọn không có nội dung. Vui lòng chọn file khác.');
      setFile(null);
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_CLASS_MATERIAL_SIZE) {
      setFileError('File vượt quá 20 MB. Vui lòng nén file hoặc chọn file nhỏ hơn.');
      setFile(null);
      event.target.value = '';
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const isLinkMaterial = materialType === 'LINK';
    if (!title.trim() || !materialType || !visibility || fileError) return;
    if (isLinkMaterial && !fileUrl.trim()) return;
    if (!isLinkMaterial && !file) return;

    const formData = new FormData();
    formData.append('topic_id', topicId);
    formData.append('title', title.trim());
    formData.append('material_type', materialType);
    formData.append('visibility', visibility);
    if (isLinkMaterial) {
      formData.append('file_url', fileUrl.trim());
    } else {
      formData.append('file', file);
    }

    setIsSaving(true);
    let saveRequest;
    if (material) {
      saveRequest = onUpdate(material._id, formData);
    } else {
      saveRequest = onCreate(formData);
    }

    saveRequest.then((created) => {
      setIsSaving(false);
      if (created) onClose();
    });
  };

  return (
    <Modal title={material ? 'Thay thế tài liệu lớp học' : 'Tải lên tài liệu lớp học'} onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="material-title"
          label="Tiêu đề tài liệu"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ví dụ: Đề cương bài giảng số 1"
          autoComplete="off"
          maxLength={200}
        />
        <FormSelect
          id="material-topic"
          label="Chủ đề bài học"
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          options={materialTopicOptions(topics)}
        />
        <FormSelect
          id="material-type"
          label="Loại tài liệu"
          value={materialType}
          onChange={(event) => {
            setMaterialType(event.target.value);
            setFile(null);
            setFileError('');
          }}
          options={MATERIAL_TYPE_OPTIONS}
          placeholder={MATERIAL_TYPE_PLACEHOLDER}
          hint={MATERIAL_TYPE_HELP}
        />
        <FormSelect
          id="material-visibility"
          label="Quyền xem tài liệu"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          options={VISIBILITY_OPTIONS}
          placeholder={MATERIAL_VISIBILITY_PLACEHOLDER}
        />
        {materialType === 'LINK' ? (
          <FormInput
            id="material-file-url"
            label="Đường dẫn URL"
            type="url"
            value={fileUrl}
            onChange={(event) => setFileUrl(event.target.value)}
            placeholder="https://example.com/tai-lieu"
            autoComplete="url"
          />
        ) : (
          <div className="form-field">
            <label htmlFor="material-file" className="form-label">Tệp đính kèm</label>
            <div className={fileError ? 'form-control has-error' : 'form-control'}>
              <input id="material-file" name="file" type="file" accept={MATERIAL_ACCEPT} onChange={handleFileChange} />
            </div>
            <p className="form-hint-left">{MATERIAL_FILE_HELP}</p>
            {file && <p className="form-hint-left">Đã chọn: {file.name} ({formatFileSize(file.size)})</p>}
            {fileError && <p className="form-error" role="alert">{fileError}</p>}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!title.trim() || !materialType || !visibility || Boolean(fileError) || (materialType === 'LINK' ? !fileUrl.trim() : !file) || isSaving}
          >
            <Upload size={14} aria-hidden="true" />
            <span>{isSaving ? 'Đang tải lên...' : material ? 'Cập nhật tài liệu' : 'Tải lên tài liệu'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteMaterialModal({ material, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(material._id).then((deleted) => {
      setIsDeleting(false);
      if (deleted) onClose();
    });
  };

  return (
    <Modal title="Xóa tài liệu" onClose={onClose}>
      <div className="class-create-form">
        <p>Bạn có chắc muốn xóa “{material.title}” khỏi lớp học này?</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Hủy</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</button>
        </div>
      </div>
    </Modal>
  );
}

function CreateTopicModal({ onClose, onCreate }) {
  const [topicName, setTopicName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = topicName.trim();
    if (!trimmedName) {
      return;
    }
    setIsSaving(true);
    onCreate(trimmedName).then((created) => {
      setIsSaving(false);
      if (created) onClose();
    });
  };

  return (
    <Modal title="Tạo chủ đề bài học" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="topic-name"
          label="Tên chủ đề"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          placeholder="Ví dụ: Chương 1: Đạo hàm và Ứng dụng"
          autoComplete="off"
        />
        <p className="class-form-note">Chủ đề này sẽ được lưu vào lộ trình học tập của lớp.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Đang lưu...' : 'Tạo chủ đề'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditTopicModal({ topic, onClose, onUpdate }) {
  const [topicName, setTopicName] = useState(topic.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = topicName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    onUpdate(topic._id, trimmedName).then((updated) => {
      setIsSaving(false);
      if (updated) onClose();
    });
  };

  return (
    <Modal title="Chỉnh sửa chủ đề" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="edit-topic-name"
          label="Tên chủ đề"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          autoComplete="off"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTopicModal({ topic, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(topic._id).then((deleted) => {
      setIsDeleting(false);
      if (deleted) onClose();
    });
  };

  return (
    <Modal title="Xóa chủ đề" onClose={onClose}>
      <div className="class-create-form">
        <p>Bạn có chắc muốn xóa “{topic.name}”? Các tài liệu thuộc chủ đề này vẫn được giữ lại nhưng sẽ không còn liên kết chủ đề.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Hủy</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClassroomTopicsAndMaterials({
  classId,
  topics,
  materials,
  topicsLoading,
  topicsError,
  onRetryTopics,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  onCreateMaterial,
  materialsLoading,
  materialsError,
  onRetryMaterials,
  onUpdateMaterial,
  onDeleteMaterial,
}) {
  const [modal, setModal] = useState('');

  return (
    <div className="class-detail-content-grid">
      <section className="class-detail-section" aria-labelledby="class-topics-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><BookOpen size={18} /></span>
          <div>
            <h2 id="class-topics-title">Chủ đề bài học</h2>
            <p>Kế hoạch và lộ trình học tập của lớp</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('topic')}>
            <Plus size={14} aria-hidden="true" />
            <span>Thêm chủ đề</span>
          </button>
        </div>
        {topicsError ? (
          <Alert type="error">
            <p>{topicsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryTopics}>Thử lại</button>
          </Alert>
        ) : topicsLoading ? (
          <p role="status">Đang tải danh sách chủ đề...</p>
        ) : topics.length === 0 ? (
          <EmptyState icon={BookOpen} title="Chưa có chủ đề nào" description="Tạo chủ đề để sắp xếp lộ trình học tập cho lớp." />
        ) : (
          <ol className="class-topic-list">
            {topics.map((topic, index) => (
              <li key={topic._id}>
                <span className="class-topic-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{topic.name}</span>
                <span className="class-topic-actions">
                  {classId && (
                    <Link
                      to={`/tutor/classes/${classId}/assignments/new?topic=${encodeURIComponent(topic.name || '')}`}
                      className="btn btn-outline btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#ea580c',
                        borderColor: '#fdba74',
                        background: '#fff7ed',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      title={`Tạo bài tập tự động bằng AI từ chủ đề "${topic.name}"`}
                    >
                      <Sparkles size={14} color="#ea580c" aria-hidden="true" />
                      <span>AI tạo bài tập</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-label={`Sửa ${topic.name}`}
                    onClick={() => setModal({ type: 'edit-topic', topic: topic })}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm class-topic-delete-button"
                    aria-label={`Xóa ${topic.name}`}
                    onClick={() => setModal({ type: 'delete-topic', topic: topic })}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Xóa</span>
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="class-detail-section" aria-labelledby="class-materials-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
          <div>
            <h2 id="class-materials-title">Tài liệu lớp học</h2>
            <p>Tài nguyên và tài liệu chia sẻ cho học viên</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('material')}>
            <Plus size={14} aria-hidden="true" />
            <span>Thêm tài liệu</span>
          </button>
        </div>
        {materialsError ? (
          <Alert type="error">
            <p>{materialsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryMaterials}>Thử lại</button>
          </Alert>
        ) : materialsLoading ? (
          <p role="status">Đang tải tài liệu...</p>
        ) : materials.length === 0 ? (
          <EmptyState icon={FileText} title="Chưa có tài liệu nào" description="Thêm tài liệu hoặc liên kết cho học viên trong lớp." />
        ) : (
          <ul className="class-material-list">
            {materials.map((material) => (
              <li key={material._id} className="class-material-row">
                <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
                <span className="class-material-copy">
                  <span className="class-material-title">{material.title}</span>
                  <span className="class-material-detail">
                    {material.material_type || material.type} · {material.material_type === 'LINK' ? 'Liên kết ngoài' : formatFileSize(material.file_size)}
                  </span>
                </span>
                {material.file_url && (
                  <a className="btn btn-outline btn-sm" href={material.file_url} target="_blank" rel="noreferrer">Mở xem</a>
                )}
                {classId && (
                  <Link
                    to={`/tutor/classes/${classId}/assignments/new?materialId=${material._id}&materialTitle=${encodeURIComponent(material.title || '')}`}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ea580c',
                      borderColor: '#fdba74',
                      background: '#fff7ed',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                    title="Tạo bài tập tự động bằng AI từ tài liệu này"
                  >
                    <Sparkles size={14} color="#ea580c" aria-hidden="true" />
                    <span>AI tạo bài tập</span>
                  </Link>
                )}
                <span className="class-topic-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-label={`Sửa ${material.title}`}
                    onClick={() => setModal({ type: 'edit-material', material: material })}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm class-topic-delete-button"
                    aria-label={`Xóa ${material.title}`}
                    onClick={() => setModal({ type: 'delete-material', material: material })}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Xóa</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === 'topic' && <CreateTopicModal onClose={() => setModal('')} onCreate={onCreateTopic} />}
      {modal === 'material' && (
        <CreateMaterialModal
          onClose={() => setModal('')}
          onCreate={onCreateMaterial}
          topics={topics}

        />
      )}
      {modal.type === 'edit-material' && (
        <CreateMaterialModal
          onClose={() => setModal('')}
          onCreate={onCreateMaterial}
          onUpdate={onUpdateMaterial}
          topics={topics}
          material={modal.material}

        />
      )}
      {modal.type === 'delete-material' && (
        <DeleteMaterialModal
          material={modal.material}
          onClose={() => setModal('')}
          onDelete={onDeleteMaterial}

        />
      )}
      {modal.type === 'edit-topic' && <EditTopicModal topic={modal.topic} onClose={() => setModal('')} onUpdate={onUpdateTopic} />}
      {modal.type === 'delete-topic' && <DeleteTopicModal topic={modal.topic} onClose={() => setModal('')} onDelete={onDeleteTopic} />}
    </div>
  );
}
