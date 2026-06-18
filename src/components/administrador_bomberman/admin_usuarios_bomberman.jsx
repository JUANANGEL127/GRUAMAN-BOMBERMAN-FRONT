import React from "react";
import AdminUsersTemporalPage from "../../features/admin-users-temporal/AdminUsersTemporalPage";

const BOMBERMAN_EMPRESA_IDS = [2, 5];

function AdminUsuariosBomberman() {
  return (
    <AdminUsersTemporalPage
      title="Administrar Usuarios"
      subtitle="Administrá personas, activación permanente y novedades de ausentismo desde una sola vista."
      empresaId={2}
      empresaIds={BOMBERMAN_EMPRESA_IDS}
      menuRoute="/administrador_bomberman"
    />
  );
}

export default AdminUsuariosBomberman;
