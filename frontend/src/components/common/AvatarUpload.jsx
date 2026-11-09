import { useEffect, useId, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadMyAvatar } from '../../services/avatarService';
import '../../styles/avatarUpload.css';

export default function AvatarUpload({ fallbackUrl, onUploaded }) {
  const { user, updateAvatarUrl } = useAuth();
  const inputId = useId();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (event) => {
    setError('');
    setNotice('');
    const image = event.target.files[0];
    if (!image) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024) {
      setError('Chọn ảnh JPEG, PNG hoặc WebP không quá 5 MB.');
      event.target.value = '';
      return;
    }
    setFile(image);
  };
  const upload = async () => {
    setUploading(true);
    setError('');
    try {
      const response = await uploadMyAvatar(file);
      updateAvatarUrl(response.data.avatar_url);
      setFile(null);
      setNotice('Đã cập nhật ảnh đại diện.');
      if (onUploaded) onUploaded(response.data.avatar_url);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  };
  const avatarUrl = preview || user?.avatar_url || fallbackUrl;
  if (!user) return null;
  return (
    <section className="avatar-upload" aria-label="Ảnh đại diện">
      <div className="avatar-upload-preview">
        {avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện của bạn" /> : <Camera size={30} aria-hidden="true" />}
      </div>
      <div className="avatar-upload-controls">
        <label htmlFor={inputId} className="form-label">Ảnh đại diện</label>
        <p>JPEG, PNG hoặc WebP, tối đa 5 MB.</p>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={chooseFile} />
        {file && <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={upload}><Upload size={16} aria-hidden="true" />{uploading ? 'Đang tải lên...' : 'Lưu ảnh đại diện'}</button>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </div>
    </section>
  );
}
