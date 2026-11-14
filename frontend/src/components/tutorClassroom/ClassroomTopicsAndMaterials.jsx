import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, FileText, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Modal from '../common/Modal';
import Alert from '../common/Alert';

const MATERIAL_TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Tài liệu' },
  { value: 'SLIDE', label: 'Bài trình chiếu' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'LINK', label: 'Liên kết' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL_MEMBERS', label: 'Tất cả thành viên lớp' },
  { value: 'STUDENTS_ONLY', label: 'Chỉ học sinh' },
];

const MATERIAL_TYPE_LABELS = {
  DOCUMENT: 'Tài liệu',
  SLIDE: 'Bài trình chiếu',
  VIDEO: 'Video',
  LINK: 'Liên kết',
};

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
  if (!fileSize) return 'Không rõ dung lượng';
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const MATERIAL_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4,.zip';

const MATERIAL_FILE_HELP = 'Cho phép PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, MP4, ZIP. Tối đa 20 MB.';

const MATERIAL_TYPE_HELP = 'Chọn Liên kết để lưu URL, hoặc chọn loại tệp để tải tệp lên.';

const MATERIAL_TYPE_PLACEHOLDER = 'Chọn loại tài liệu';
const MATERIAL_TYPE_PLACEHOLDER = 'Chọn loại tài liệu';

const MATERIAL_VISIBILITY_PLACEHOLDER = 'Chọn người được xem tài liệu';

const MATERIAL_TOPIC_NONE = { value: '', label: 'Không gắn chủ đề' };
const ALL_MATERIAL_TOPICS = '__all_topics__';
const UNASSIGNED_MATERIAL_TOPIC = '__unassigned_topic__';

const normalizeSearch = (text) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');

const isImageMaterial = (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
};

const isWebLink = (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

function CreateMaterialModal({ onClose, onCreate, onUpdate, topics, material }) {
  const [title, setTitle] = useState(material ? material.title : '');
  const [materialType, setMaterialType] = useState(material ? material.material_type : '');
  const [topicId, setTopicId] = useState(material && material.topic_id ? material.topic_id : '');
  const [visibility, setVisibility] = useState(material ? material.visibility : '');
  const [fileUrl, setFileUrl] = useState(material && material.material_type === 'LINK' ? material.file_url : '');
  const [file, setFile] = useState(null);
  const [topicQuery, setTopicQuery] = useState('');
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(-1);
  const [fileError, setFileError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const originalTopicId = material && material.topic_id ? material.topic_id : '';
  const hasChanges = !material || Boolean(file) || title.trim() !== material.title ||
    topicId !== originalTopicId || materialType !== material.material_type ||
    visibility !== material.visibility ||
    (materialType === 'LINK' && fileUrl.trim() !== (material.material_type === 'LINK' ? material.file_url : ''));
  const requiresReplacementFile = material && material.material_type === 'LINK' && materialType !== 'LINK';
  const selectedTopic = topics.find((topic) => topic._id === topicId);
  const selectedTopicName = selectedTopic ? selectedTopic.name : '';
  const filteredTopics = topics.filter((topic) => normalizeSearch(topic.name).includes(normalizeSearch(topicQuery.trim())));
  const topicOptions = [MATERIAL_TOPIC_NONE, ...filteredTopics.map((topic) => ({ value: topic._id, label: topic.name }))];

  const clearValidationError = (field) => {
    setValidationErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const chooseTopic = (nextTopicId) => {
    setTopicId(nextTopicId);
    setTopicQuery('');
    setTopicPickerOpen(false);
    setActiveTopicIndex(-1);
    clearValidationError('form');
  };

  const handleTopicKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setTopicPickerOpen(false);
      setTopicQuery('');
      setActiveTopicIndex(-1);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setTopicPickerOpen(true);
      setActiveTopicIndex((currentIndex) => {
        const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        return (nextIndex + topicOptions.length) % topicOptions.length;
      });
      return;
    }

    if (event.key === 'Enter' && topicPickerOpen && topicOptions.length > 0) {
      event.preventDefault();
      const optionIndex = activeTopicIndex < 0 ? 0 : activeTopicIndex;
      chooseTopic(topicOptions[optionIndex].value);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    setFileError('');
    clearValidationError('file');
    clearValidationError('form');
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
    const errors = {};

    if (!title.trim()) errors.title = 'Vui lòng nhập tiêu đề.';
    if (!materialType) errors.materialType = 'Vui lòng chọn loại tài liệu.';
    if (!visibility) errors.visibility = 'Vui lòng chọn phạm vi hiển thị.';
    if (fileError) errors.file = fileError;

    if (isLinkMaterial) {
      if (!fileUrl.trim()) {
        errors.fileUrl = 'Vui lòng nhập URL.';
      } else {
        try {
          const parsedUrl = new URL(fileUrl.trim());
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            errors.fileUrl = 'URL phải bắt đầu bằng http:// hoặc https://.';
          }
        } catch {
          errors.fileUrl = 'Vui lòng nhập URL hợp lệ.';
        }
      }
    } else if (materialType && (!material || requiresReplacementFile) && !file && !fileError) {
      errors.file = 'Vui lòng chọn file tài liệu.';
    }

    if (material && !hasChanges) errors.form = 'Chưa có thay đổi nào để lưu.';

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    if (material) {
      if (title.trim() !== material.title) formData.append('title', title.trim());
      if (topicId !== originalTopicId) formData.append('topic_id', topicId);
      if (materialType !== material.material_type) formData.append('material_type', materialType);
      if (visibility !== material.visibility) formData.append('visibility', visibility);
      if (isLinkMaterial && fileUrl.trim() !== (material.material_type === 'LINK' ? material.file_url : '')) {
        formData.append('file_url', fileUrl.trim());
      }
      if (file) formData.append('file', file);
    } else {
      formData.append('topic_id', topicId);
      formData.append('title', title.trim());
      formData.append('material_type', materialType);
      formData.append('visibility', visibility);
      if (isLinkMaterial) {
        formData.append('file_url', fileUrl.trim());
      } else {
        formData.append('file', file);
      }
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
    <Modal title={material ? 'Chỉnh sửa tài liệu lớp học' : 'Tải tài liệu lên lớp'} onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error"><strong>{material ? 'Không thể cập nhật tài liệu' : 'Không thể tải tài liệu lên'}</strong><p>{error}</p></Alert>}
        <FormInput
          id="material-title"
          label="Tiêu đề"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            clearValidationError('title');
            clearValidationError('form');
          }}
          error={validationErrors.title}
          placeholder="Ví dụ: Ghi chú bài học"
          autoComplete="off"
          maxLength={200}
        />
        <div
          className="class-material-topic-picker form-field"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setTopicPickerOpen(false);
              setTopicQuery('');
              setActiveTopicIndex(-1);
            }
          }}
        >
          <label htmlFor="material-topic-search" className="form-label">Chủ đề</label>
          <div className="class-material-topic-control form-control">
            <Search size={16} aria-hidden="true" />
            <input
              id="material-topic-search"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={topicPickerOpen}
              aria-controls="material-topic-options"
              aria-activedescendant={topicPickerOpen && activeTopicIndex >= 0 ? `material-topic-option-${activeTopicIndex}` : undefined}
              value={topicPickerOpen ? topicQuery : selectedTopicName}
              placeholder="Gõ để tìm chủ đề..."
              autoComplete="off"
              onFocus={() => {
                setTopicQuery('');
                setTopicPickerOpen(true);
                setActiveTopicIndex(-1);
              }}
              onChange={(event) => {
                setTopicQuery(event.target.value);
                setTopicPickerOpen(true);
                setActiveTopicIndex(-1);
              }}
              onKeyDown={handleTopicKeyDown}
            />
            <button
              type="button"
              className="form-control-action"
              aria-label={topicPickerOpen ? 'Đóng danh sách chủ đề' : 'Mở danh sách chủ đề'}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setTopicPickerOpen((isOpen) => !isOpen);
                setTopicQuery('');
                setActiveTopicIndex(-1);
              }}
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
          {topicPickerOpen && (
            <ul id="material-topic-options" className="class-material-topic-options" role="listbox" aria-label="Danh sách chủ đề">
              <li
                id="material-topic-option-0"
                role="option"
                aria-selected={!topicId}
                className={activeTopicIndex === 0 ? 'is-active' : ''}
              >
                <button type="button" tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseTopic('')}>
                  {MATERIAL_TOPIC_NONE.label}
                </button>
              </li>
              {filteredTopics.map((topic, index) => (
                <li
                  key={topic._id}
                  id={`material-topic-option-${index + 1}`}
                  role="option"
                  aria-selected={topic._id === topicId}
                  className={activeTopicIndex === index + 1 ? 'is-active' : ''}
                >
                  <button type="button" tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseTopic(topic._id)}>
                    {topic.name}
                  </button>
                </li>
              ))}
              {filteredTopics.length === 0 && topicQuery && (
                <li className="class-material-topic-empty" role="presentation">Không tìm thấy chủ đề phù hợp.</li>
              )}
            </ul>
          )}
          <p className="form-hint-left">Để trống nếu không muốn gắn chủ đề.</p>
        </div>
        <FormSelect
          id="material-type"
          label="Loại tài liệu"
          label="Loại tài liệu"
          value={materialType}
          onChange={(event) => {
            const nextMaterialType = event.target.value;
            setMaterialType(nextMaterialType);
            if (nextMaterialType === 'LINK') setFile(null);
            setFileError('');
            clearValidationError('materialType');
            clearValidationError('file');
            clearValidationError('fileUrl');
            clearValidationError('form');
          }}
          error={validationErrors.materialType}
          options={MATERIAL_TYPE_OPTIONS}
          placeholder={MATERIAL_TYPE_PLACEHOLDER}
          hint={MATERIAL_TYPE_HELP}
        />
        <FormSelect
          id="material-visibility"
          label="Phạm vi hiển thị"
          value={visibility}
          onChange={(event) => {
            setVisibility(event.target.value);
            clearValidationError('visibility');
            clearValidationError('form');
          }}
          error={validationErrors.visibility}
          options={VISIBILITY_OPTIONS}
          placeholder={MATERIAL_VISIBILITY_PLACEHOLDER}
        />
        {materialType === 'LINK' ? (
          <FormInput
            id="material-file-url"
            label="Đường dẫn"
            type="url"
            value={fileUrl}
            onChange={(event) => {
              setFileUrl(event.target.value);
              clearValidationError('fileUrl');
              clearValidationError('form');
            }}
            error={validationErrors.fileUrl}
            placeholder="https://example.com/resource"
            autoComplete="url"
          />
        ) : (
          <div className="form-field">
            <label htmlFor="material-file-button" className="form-label">Tệp</label>
            <div className={`class-material-file-picker${fileError || validationErrors.file ? ' has-error' : ''}`}>
              <button
                id="material-file-button"
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden="true" />
                Chọn tệp
              </button>
              <input
                ref={fileInputRef}
                id="material-file"
                className="visually-hidden"
                name="file"
                type="file"
                accept={MATERIAL_ACCEPT}
                tabIndex={-1}
                onChange={handleFileChange}
              />
              <span className="class-material-file-name">
                {file ? file.name : material && material.material_type !== 'LINK' ? 'Giữ nguyên tệp hiện tại' : 'Chưa chọn tệp'}
              </span>
            </div>
            <p className="form-hint-left">{MATERIAL_FILE_HELP}</p>
            {file && <p className="form-hint-left">Tệp đã chọn ({formatFileSize(file.size)})</p>}
            {(fileError || validationErrors.file) && <p className="form-error" role="alert">{fileError || validationErrors.file}</p>}
          </div>
        )}
        {validationErrors.form && <p className="form-error" role="alert">{validationErrors.form}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSaving}
          >
            <Upload size={14} aria-hidden="true" />
            <span>{isSaving ? 'Đang lưu...' : material ? 'Lưu thay đổi' : 'Tải lên tài liệu'}</span>
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
    <Modal title="Xóa tài liệu" onClose={onClose}>
      <div className="class-create-form">
        <p>Xóa “{material.title}” khỏi lớp học này?</p>
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Hủy</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xóa tài liệu'}</button>
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
    <Modal title="Tạo chủ đề" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="topic-name"
          label="Tên chủ đề"
          label="Tên chủ đề"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          placeholder="Ví dụ: Chương 1"
          autoComplete="off"
        />
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <p className="class-form-note">Chủ đề sẽ được lưu vào lớp học.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Đang lưu...' : 'Tạo chủ đề'}</button>
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
    <Modal title="Chỉnh sửa chủ đề" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="edit-topic-name"
          label="Tên chủ đề"
          label="Tên chủ đề"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          autoComplete="off"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Hủy</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
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
    <Modal title="Xóa chủ đề" onClose={onClose}>
      <div className="class-create-form">
        <p>Xóa “{topic.name}”? Tài liệu liên kết với chủ đề vẫn được giữ lại nhưng sẽ bỏ liên kết.</p>
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Hủy</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xóa chủ đề'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClassroomTopicsAndMaterials({
  classId,
  topics,
  newlyCreatedTopicId,
  materials,
  topicsLoading,
  topicsError,
  createTopicError,
  createTopicNotice,
  topicActionError,
  onRetryTopics,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  onCreateMaterial,
  createMaterialError,
  createMaterialNotice,
  newlyCreatedMaterialId,
  materialsLoading,
  materialsError,
  onRetryMaterials,
  onUpdateMaterial,
  onDeleteMaterial,
}) {
  const [modal, setModal] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedMaterialTopicId, setSelectedMaterialTopicId] = useState(ALL_MATERIAL_TOPICS);
  const [previewMaterialId, setPreviewMaterialId] = useState('');
  const previewSectionRef = useRef(null);
  const materialsSectionRef = useRef(null);
  const normalizedMaterialSearch = normalizeSearch(materialSearchQuery.trim());
  const filteredMaterials = materials.filter((material) => {
    const materialTitle = normalizeSearch(material.title || '');
    const matchesSearch = materialTitle.includes(normalizedMaterialSearch);
    let matchesTopic = selectedMaterialTopicId === ALL_MATERIAL_TOPICS;

    if (selectedMaterialTopicId === UNASSIGNED_MATERIAL_TOPIC) {
      matchesTopic = !material.topic_id;
    } else if (selectedMaterialTopicId !== ALL_MATERIAL_TOPICS) {
      matchesTopic = material.topic_id === selectedMaterialTopicId;
    }

    return matchesSearch && matchesTopic;
  });
  const materialTopicFilterOptions = [
    { value: ALL_MATERIAL_TOPICS, label: 'Tất cả chủ đề' },
    { value: UNASSIGNED_MATERIAL_TOPIC, label: 'Không gắn chủ đề' },
    ...topics.map((topic) => ({ value: topic._id, label: topic.name })),
  ];
  const previewMaterial = materials.find((material) => material._id === previewMaterialId);

  useEffect(() => {
    if (previewMaterialId && previewSectionRef.current) {
      previewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewMaterialId]);

  return (
    <div className="class-detail-content-grid">
      <section className="class-detail-section" aria-labelledby="class-topics-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><BookOpen size={18} /></span>
          <div>
            <h2 id="class-topics-title">Chủ đề</h2>
            <p>Kế hoạch học tập của lớp</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('topic')}>
            <Plus size={14} aria-hidden="true" />
            <span>Tạo chủ đề</span>
          </button>
        </div>
        {createTopicError && <Alert type="error"><p>{createTopicError}</p></Alert>}
        {createTopicNotice && <Alert type="success"><p>{createTopicNotice}</p></Alert>}
        {topicActionError && <Alert type="error"><p>{topicActionError}</p></Alert>}
        {topicsError ? (
          <Alert type="error">
            <p>{topicsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryTopics}>Thử lại</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryTopics}>Thử lại</button>
          </Alert>
        ) : topicsLoading ? (
          <p role="status">Đang tải chủ đề...</p>
        ) : topics.length === 0 ? (
          <EmptyState icon={BookOpen} title="Chưa có chủ đề" description="Tạo chủ đề để sắp xếp nội dung học tập của lớp." />
        ) : (
          <ol className="class-topic-list">
            {topics.map((topic, index) => (
              <li
                key={topic._id}
                className={topic._id === newlyCreatedTopicId ? 'is-new' : ''}
              >
                <button
                  type="button"
                  className={selectedMaterialTopicId === topic._id ? 'class-topic-filter-button is-selected' : 'class-topic-filter-button'}
                  onClick={() => {
                    setSelectedMaterialTopicId(topic._id);
                    if (materialsSectionRef.current) {
                      materialsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  aria-pressed={selectedMaterialTopicId === topic._id}
                >
                  <span className="class-topic-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>{topic.name}</span>
                </button>
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
                    aria-label={`Chỉnh sửa ${topic.name}`}
                    onClick={() => setModal({ type: 'edit-topic', topic: topic })}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Sửa</span>
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm class-topic-delete-button"
                    aria-label={`Xóa ${topic.name}`}
                    aria-label={`Xóa ${topic.name}`}
                    onClick={() => setModal({ type: 'delete-topic', topic: topic })}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Xóa</span>
                    <span>Xóa</span>
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section ref={materialsSectionRef} className="class-detail-section" aria-labelledby="class-materials-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
          <div>
            <h2 id="class-materials-title">Tài liệu</h2>
            <p>Tài nguyên chia sẻ với học sinh</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('material')}>
            <Plus size={14} aria-hidden="true" />
            <span>Thêm tài liệu</span>
            <span>Thêm tài liệu</span>
          </button>
        </div>
        {createMaterialError && <Alert type="error"><p>{createMaterialError}</p></Alert>}
        {createMaterialNotice && (
          <Alert type={createMaterialNotice.type}><p>{createMaterialNotice.message}</p></Alert>
        )}
        {materialsError ? (
          <Alert type="error">
            <p>{materialsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryMaterials}>Thử lại</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryMaterials}>Thử lại</button>
          </Alert>
        ) : materialsLoading ? (
          <p role="status">Đang tải tài liệu...</p>
          <p role="status">Đang tải tài liệu...</p>
        ) : materials.length === 0 ? (
          <EmptyState icon={FileText} title="Chưa có tài liệu" description="Thêm tài nguyên để chia sẻ với học sinh trong lớp." />
        ) : (
          <>
            <div className="class-material-search-filters">
              <div className="form-field">
                <label htmlFor="class-material-search" className="form-label">Tìm tài liệu</label>
                <div className="form-control class-material-search-control">
                  <Search size={16} aria-hidden="true" />
                  <input
                    id="class-material-search"
                    type="search"
                    value={materialSearchQuery}
                    onChange={(event) => setMaterialSearchQuery(event.target.value)}
                    placeholder="Nhập tên tài liệu"
                    autoComplete="off"
                  />
                </div>
              </div>
              <FormSelect
                id="class-material-topic-filter"
                label="Lọc theo chủ đề"
                value={selectedMaterialTopicId}
                onChange={(event) => setSelectedMaterialTopicId(event.target.value)}
                options={materialTopicFilterOptions}
              />
            </div>
            {filteredMaterials.length === 0 ? (
              <p className="class-material-filter-empty" role="status">Không tìm thấy tài liệu phù hợp.</p>
            ) : (
              <ul className="class-material-list">
                {filteredMaterials.map((material) => {
                  const isPreviewOpen = previewMaterialId === material._id;
                  const canPreviewImage = isImageMaterial(material.file_url);
                  const canPreviewLink = material.material_type === 'LINK' && isWebLink(material.file_url);
                  const canPreviewInline = canPreviewImage || canPreviewLink;

                  return (
                    <li
                      key={material._id}
                      className={`class-material-row${material._id === newlyCreatedMaterialId ? ' is-new' : ''}`}
                    >
                      <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
                      <span className="class-material-copy">
                        <span className="class-material-title">{material.title}</span>
                        <span className="class-material-detail">
                          {MATERIAL_TYPE_LABELS[material.material_type || material.type] || material.material_type || material.type} · {material.material_type === 'LINK' ? 'Liên kết ngoài' : formatFileSize(material.file_size)}
                        </span>
                      </span>
                      {material.file_url && canPreviewInline ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          aria-expanded={isPreviewOpen}
                          aria-controls="class-material-preview-section"
                          onClick={() => setPreviewMaterialId(isPreviewOpen ? '' : material._id)}
                        >
                          {isPreviewOpen ? 'Đóng' : 'Mở'}
                        </button>
                      ) : material.file_url ? (
                        <a className="btn btn-outline btn-sm" href={material.file_url} target="_blank" rel="noreferrer">Mở</a>
                      ) : null}
                      <span className="class-topic-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          aria-label={`Thay thế ${material.title}`}
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
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>

      {previewMaterial && (
        <section
          id="class-material-preview-section"
          ref={previewSectionRef}
          className="class-detail-section class-material-preview-section"
          aria-labelledby="class-material-preview-title"
        >
          <div className="class-detail-section-heading">
            <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
            <div>
              <h2 id="class-material-preview-title">Tài liệu xem trước</h2>
              <p>{previewMaterial.title}</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPreviewMaterialId('')}>
              Đóng xem trước
            </button>
          </div>
          {previewMaterial.material_type === 'LINK' ? (
            <>
              <div className="class-material-link-preview">
                <iframe
                  src={previewMaterial.file_url}
                  title={`Xem trước liên kết: ${previewMaterial.title}`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <a className="class-material-preview-fallback" href={previewMaterial.file_url} target="_blank" rel="noreferrer">
                Nếu trang không hiển thị ở đây, mở liên kết trong tab mới
              </a>
            </>
          ) : (
            <div className="class-material-preview">
              <img src={previewMaterial.file_url} alt={`Xem trước: ${previewMaterial.title}`} />
            </div>
          )}
        </section>
      )}

      {modal === 'topic' && <CreateTopicModal onClose={() => setModal('')} onCreate={onCreateTopic} error={createTopicError} />}
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
