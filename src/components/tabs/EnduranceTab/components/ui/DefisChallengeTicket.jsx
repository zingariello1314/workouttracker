import React from 'react';
import { Award, Edit, Trash2 } from 'lucide-react';

const DefisChallengeTicket = ({
  title,
  children,
  statusLabel,
  onEdit,
  onDelete,
  editTitle,
  deleteTitle
}) => (
  <article className="ticket">
    <div className="l">
      <Award className="ic" />
    </div>
    <div className="m">
      <h3>{title}</h3>
      {children}
    </div>
    <div className="r">
      <span className="st">{statusLabel}</span>
      <button type="button" className="ib" onClick={onEdit} title={editTitle} aria-label={editTitle}>
        <Edit className="ic" />
      </button>
      <button type="button" className="ib del" onClick={onDelete} title={deleteTitle} aria-label={deleteTitle}>
        <Trash2 className="ic" />
      </button>
    </div>
  </article>
);

export default React.memo(DefisChallengeTicket);
