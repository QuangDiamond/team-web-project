import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Alert from '../common/Alert';
import EmptyState from '../common/EmptyState';
import { getClassMaterials } from '../../services/classroomService';
import '../../styles/classDetail.css';

const formatFileSize = (fileSize) => {
  if (!fileSize) return 'Không rõ dung lượng';
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

// Tài liệu lớp ở chế độ chỉ xem cho học sinh / phụ huynh (SC36). Gia sư quản lý tài liệu ở ClassroomTopicsAndMaterials
export default function ClassroomMaterialsTab({ classId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getClassMaterials(classId);
      setMaterials(response.data.items);
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải tài liệu lớp học');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const renderContent = () => {
    if (error) {
      return (
        <Alert type="error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={loadMaterials}>Thử lại</button>
        </Alert>
      );
    }
    if (loading) {
      return <p role="status">Đang tải tài liệu...</p>;
    }
    if (materials.length === 0) {
      return <EmptyState icon={FileText} title="Chưa có tài liệu nào" description="Gia sư chưa chia sẻ tài liệu cho lớp này." />;
    }
    return (
      <ul className="class-material-list">
        {materials.map((material) => (
          <li key={material._id} className="class-material-row">
            <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
            <span className="class-material-copy">
              <span className="class-material-title">{material.title}</span>
              <span className="class-material-detail">
                {material.material_type} · {material.material_type === 'LINK' ? 'Liên kết ngoài' : formatFileSize(material.file_size)}
              </span>
            </span>
            {material.file_url && (
              <a className="btn btn-outline btn-sm" href={material.file_url} target="_blank" rel="noreferrer">Mở xem</a>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="class-detail-section" aria-labelledby="class-materials-title">
      <div className="class-detail-section-heading">
        <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
        <div>
          <h2 id="class-materials-title">Tài liệu lớp học</h2>
          <p>Tài nguyên và tài liệu gia sư chia sẻ cho lớp</p>
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
