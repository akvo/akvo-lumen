import React from 'react';
import { Link } from 'react-router';

export default function NavWorkspaceSwitch() {
  return (
    <div className="NavWorkspaceSwitch">
      <Link to="/admin/users">Admin view</Link>
    </div>
  );
}
