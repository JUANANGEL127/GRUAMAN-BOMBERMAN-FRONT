import React from "react";
import AdminUsersTemporalPage from "../../features/admin-users-temporal/AdminUsersTemporalPage";

const GRUAMAN_EMPRESA_IDS = [];

function AdminUsuarios() {
  return (
    <AdminUsersTemporalPage
      title="Administrar Usuarios"
      subtitle="Administrá personas, activación permanente y novedades de ausentismo desde una sola vista."
      empresaId={1}
      empresaIds={GRUAMAN_EMPRESA_IDS}
      menuRoute="/administrador"
    />
  );
}

export default AdminUsuarios;
