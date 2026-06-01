(function () {
  "use strict";

  /**
   * Initialize the isolated playground without leaking temporary variables.
   */
  const root = document.querySelector("[data-cloth-lab]");

  if (root && window.ClothLabEffect) {
    try {
      new window.ClothLabEffect(root);
    } catch (error) {
      console.error("Cloth playground failed to initialize:", error);
    }
  }
})();
