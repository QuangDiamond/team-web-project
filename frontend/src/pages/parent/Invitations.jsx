import { Link } from 'react-router-dom';
import SentInvitations from './SentInvitations';
import '../../styles/invitations.css';

// UC14: manage sent invitations; tutor discovery is available on the public /tutors page.
export default function Invitations() {

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <h2>Lời mời đã gửi</h2>
        <Link to="/tutors" className="btn btn-primary">Tìm gia sư để mời</Link>
      </div>
      <SentInvitations />
    </div>
  );
}
