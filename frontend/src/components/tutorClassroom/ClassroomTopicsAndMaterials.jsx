import { useState } from 'react';
import { BookOpen, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Modal from '../common/Modal';
import Alert from '../common/Alert';

const MATERIAL_TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'SLIDE', label: 'Slide' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'LINK', label: 'Link' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL_MEMBERS', label: 'All class members' },
  { value: 'STUDENTS_ONLY', label: 'Students only' },
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
  if (!fileSize) return 'Unknown file size';
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const MATERIAL_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4,.zip';

const MATERIAL_FILE_HELP = 'Allowed: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip. Maximum 20 MB.';

const MATERIAL_TYPE_HELP = 'Choose Link to save a URL, or choose a file category to upload a file.';

const MATERIAL_TYPE_PLACEHOLDER = 'Choose a material type';

const MATERIAL_VISIBILITY_PLACEHOLDER = 'Choose who can view this material';

const MATERIAL_TOPIC_NONE = { value: '', label: 'No topic' };

const materialTopicOptions = (topics) => [MATERIAL_TOPIC_NONE, ...topics.map((topic) => ({
  value: topic._id,
  label: topic.name,
}))];

function CreateMaterialModal({ onClose, onCreate, onUpdate, topics, material, error }) {
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
    <Modal title={material ? 'Replace class material' : 'Upload class material'} onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        {error && <Alert type="error"><strong>Không thể tải tài liệu lên</strong><p>{error}</p></Alert>}
        <FormInput
          id="material-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="For example: Lesson notes"
          autoComplete="off"
          maxLength={200}
        />
        <FormSelect
          id="material-topic"
          label="Topic"
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          options={materialTopicOptions(topics)}
        />
        <FormSelect
          id="material-type"
          label="Material type"
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
          label="Visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          options={VISIBILITY_OPTIONS}
          placeholder={MATERIAL_VISIBILITY_PLACEHOLDER}
        />
        {materialType === 'LINK' ? (
          <FormInput
            id="material-file-url"
            label="URL"
            type="url"
            value={fileUrl}
            onChange={(event) => setFileUrl(event.target.value)}
            placeholder="https://example.com/resource"
            autoComplete="url"
          />
        ) : (
          <div className="form-field">
            <label htmlFor="material-file" className="form-label">File</label>
            <div className={fileError ? 'form-control has-error' : 'form-control'}>
              <input id="material-file" name="file" type="file" accept={MATERIAL_ACCEPT} onChange={handleFileChange} />
            </div>
            <p className="form-hint-left">{MATERIAL_FILE_HELP}</p>
            {file && <p className="form-hint-left">Selected: {file.name} ({formatFileSize(file.size)})</p>}
            {fileError && <p className="form-error" role="alert">{fileError}</p>}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!title.trim() || !materialType || !visibility || Boolean(fileError) || (materialType === 'LINK' ? !fileUrl.trim() : !file) || isSaving}
          >
            <Upload size={14} aria-hidden="true" />
            <span>{isSaving ? 'Uploading...' : material ? 'Replace material' : 'Upload material'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteMaterialModal({ material, onClose, onDelete, error }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(material._id).then((deleted) => {
      setIsDeleting(false);
      if (deleted) onClose();
    });
  };

  return (
    <Modal title="Delete material" onClose={onClose}>
      <div className="class-create-form">
        <p>Delete “{material.title}” from this class?</p>
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete material'}</button>
        </div>
      </div>
    </Modal>
  );
}

function CreateTopicModal({ onClose, onCreate, error }) {
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
    <Modal title="Create topic" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="topic-name"
          label="Topic name"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          placeholder="For example: Chapter 1"
          autoComplete="off"
        />
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <p className="class-form-note">This topic will be saved to the class.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Saving...' : 'Create topic'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditTopicModal({ topic, onClose, onUpdate, error }) {
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
    <Modal title="Update topic" onClose={onClose}>
      <form className="class-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="edit-topic-name"
          label="Topic name"
          value={topicName}
          onChange={(event) => setTopicName(event.target.value)}
          autoComplete="off"
        />
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!topicName.trim() || isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTopicModal({ topic, onClose, onDelete, error }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(topic._id).then((deleted) => {
      setIsDeleting(false);
      if (deleted) onClose();
    });
  };

  return (
    <Modal title="Delete topic" onClose={onClose}>
      <div className="class-create-form">
        <p>Delete “{topic.name}”? Materials linked to this topic will be kept but unlinked.</p>
        {error && <Alert type="error"><p>{error}</p></Alert>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button type="button" className="btn btn-outline btn-sm class-delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete topic'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ClassroomTopicsAndMaterials({
  topics,
  materials,
  topicsLoading,
  topicsError,
  createTopicError,
  topicActionError,
  onRetryTopics,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  onCreateMaterial,
  createMaterialError,
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
            <h2 id="class-topics-title">Topics</h2>
            <p>Learning plan for this class</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('topic')}>
            <Plus size={14} aria-hidden="true" />
            <span>Create topic</span>
          </button>
        </div>
        {createTopicError && <Alert type="error"><p>{createTopicError}</p></Alert>}
        {topicActionError && <Alert type="error"><p>{topicActionError}</p></Alert>}
        {topicsError ? (
          <Alert type="error">
            <p>{topicsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryTopics}>Try again</button>
          </Alert>
        ) : topicsLoading ? (
          <p role="status">Loading topics...</p>
        ) : topics.length === 0 ? (
          <EmptyState icon={BookOpen} title="No topics yet" description="Create a topic to organize this class." />
        ) : (
          <ol className="class-topic-list">
            {topics.map((topic, index) => (
              <li key={topic._id}>
                <span className="class-topic-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{topic.name}</span>
                <span className="class-topic-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-label={`Update ${topic.name}`}
                    onClick={() => setModal({ type: 'edit-topic', topic: topic })}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm class-topic-delete-button"
                    aria-label={`Delete ${topic.name}`}
                    onClick={() => setModal({ type: 'delete-topic', topic: topic })}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Delete</span>
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
            <h2 id="class-materials-title">Materials</h2>
            <p>Resources shared with students</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm class-create-button" onClick={() => setModal('material')}>
            <Plus size={14} aria-hidden="true" />
            <span>Create material</span>
          </button>
        </div>
        {createMaterialError && <Alert type="error"><p>{createMaterialError}</p></Alert>}
        {materialsError ? (
          <Alert type="error">
            <p>{materialsError}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetryMaterials}>Try again</button>
          </Alert>
        ) : materialsLoading ? (
          <p role="status">Loading materials...</p>
        ) : materials.length === 0 ? (
          <EmptyState icon={FileText} title="No materials yet" description="Add a resource for students in this class." />
        ) : (
          <ul className="class-material-list">
            {materials.map((material) => (
              <li key={material._id} className="class-material-row">
                <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
                <span className="class-material-copy">
                  <span className="class-material-title">{material.title}</span>
                  <span className="class-material-detail">
                    {material.material_type || material.type} · {material.material_type === 'LINK' ? 'External link' : formatFileSize(material.file_size)}
                  </span>
                </span>
                {material.file_url && (
                  <a className="btn btn-outline btn-sm" href={material.file_url} target="_blank" rel="noreferrer">Open</a>
                )}
                <span className="class-topic-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-label={`Replace ${material.title}`}
                    onClick={() => setModal({ type: 'edit-material', material: material })}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm class-topic-delete-button"
                    aria-label={`Delete ${material.title}`}
                    onClick={() => setModal({ type: 'delete-material', material: material })}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === 'topic' && <CreateTopicModal onClose={() => setModal('')} onCreate={onCreateTopic} error={createTopicError} />}
      {modal === 'material' && (
        <CreateMaterialModal
          onClose={() => setModal('')}
          onCreate={onCreateMaterial}
          topics={topics}
          error={createMaterialError}
        />
      )}
      {modal.type === 'edit-material' && (
        <CreateMaterialModal
          onClose={() => setModal('')}
          onCreate={onCreateMaterial}
          onUpdate={onUpdateMaterial}
          topics={topics}
          material={modal.material}
          error={createMaterialError}
        />
      )}
      {modal.type === 'delete-material' && (
        <DeleteMaterialModal
          material={modal.material}
          onClose={() => setModal('')}
          onDelete={onDeleteMaterial}
          error={createMaterialError}
        />
      )}
      {modal.type === 'edit-topic' && <EditTopicModal topic={modal.topic} onClose={() => setModal('')} onUpdate={onUpdateTopic} error={topicActionError} />}
      {modal.type === 'delete-topic' && <DeleteTopicModal topic={modal.topic} onClose={() => setModal('')} onDelete={onDeleteTopic} error={topicActionError} />}
    </div>
  );
}
