import React from "react";

// Componente Footer con logo de la empresa
function Footer() {
  return (
    <footer
      className="app-footer"
      style={{
        background: "transparent",
        boxShadow: "none",
        border: "none",
        marginTop: "30%",
      }}
    >
      <img src="../public/logopiegye.png" alt="Logo GYE" className="footer-logo" />
    </footer>
  );
}

export default Footer;
