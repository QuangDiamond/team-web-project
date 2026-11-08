import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyClassroomsPage } from '../../services/classroomService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import TutorClassroomList from '../../components/tutorClassroom/TutorClassroomList';
import '../../styles/myClasses.css';

const PAGE_SIZE = 10;

export default function MyClasses() {
  const [page, setPage] = useState(1);
  const classrooms = usePagedList(getMyClassroomsPage, { page: page, limit: PAGE_SIZE });

  return (
    <div className="page-stack my-classes-page">
      <ListState
        list={classrooms}
        empty={{
          icon: BookOpen,
          title: 'No classes yet',
          description: 'Classes connected to your tutor profile will appear here.',
        }}
      >
        {classrooms.data && <TutorClassroomList classrooms={classrooms.data.items} />}
      </ListState>

      {classrooms.data && (
        <Pagination pagination={classrooms.data.pagination} onPageChange={setPage} />
      )}
    </div>
  );
}
