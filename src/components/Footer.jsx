import React from "react";

/**
 * Pie de página de la aplicación que muestra el logotipo de la empresa GYE.
 */
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
