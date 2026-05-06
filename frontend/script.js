/**
 * ============================================================
 * Bridge of Help Foundation — script.js
 * ============================================================
 * This file provides ALL client-side behaviour for the NGO site.
 * It NEVER touches any HTML file or CSS file.
 *
 * Sections:
 *  1. Smooth Scrolling (nav links)
 *  2. Sticky Header Shadow on Scroll
 *  3. Active Nav Link Highlighting
 *  4. Animated Stat Counters (Intersection Observer)
 *  5. "Read More" Card Expand / Collapse
 *  6. Volunteer "Apply Now" — Opens Google Form in new tab
 *  7. Donate Button — Modal Form (created via JS)
 *  8. Scroll-to-Top Button (created via JS)
 *  9. Footer Volunteer / Donation links wired to modals
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
   * 1. SMOOTH SCROLLING
   *    All anchor links (href starting with #) scroll smoothly
   *    to their target section instead of jumping.
   * ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var targetId = this.getAttribute("href").slice(1); // remove the #
      var target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });


  /* ============================================================
   * 2. STICKY HEADER — SHADOW ON SCROLL
   *    Adds a deeper shadow to the top-bar when the user scrolls
   *    down, giving a clear visual "lifted" effect.
   * ============================================================ */
  var topBar = document.querySelector(".top-bar");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      topBar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
      topBar.style.position = "sticky";
      topBar.style.top = "0";
      topBar.style.zIndex = "1000";
    } else {
      topBar.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
    }
  });


  /* ============================================================
   * 2b. RESPONSIVE NAVBAR TOGGLE (HAMBURGER)
   *     Mobile: shows a 3-line button that opens/closes the menu.
   *     Desktop: menu is always visible, button is hidden via CSS.
   * ============================================================ */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("nav-menu-open");
      navToggle.classList.toggle("nav-open-line", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when a nav link is clicked on small screens
    navMenu.addEventListener("click", function (event) {
      if (event.target && event.target.matches("a[href^='#']")) {
        if (window.innerWidth < 768) {
          navMenu.classList.remove("nav-menu-open");
          navToggle.classList.remove("nav-open-line");
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });

    // Ensure correct state when resizing between mobile / desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) {
        navMenu.classList.remove("nav-menu-open");
        navToggle.classList.remove("nav-open-line");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }


  /* ============================================================
   * 3. ACTIVE NAV LINK HIGHLIGHTING
   *    As the user scrolls, the matching nav link is highlighted
   *    by adding/removing an inline color style.
   * ============================================================ */
  var navLinks = document.querySelectorAll(".top-links a[href^='#']");
  var sections = [];

  // Collect sections that match the nav links
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    var section = document.getElementById(id);
    if (section) {
      sections.push({ link: link, section: section });
    }
  });

  window.addEventListener("scroll", function () {
    var scrollPos = window.scrollY + 120; // offset for header height

    sections.forEach(function (item) {
      var top = item.section.offsetTop;
      var bottom = top + item.section.offsetHeight;

      if (scrollPos >= top && scrollPos < bottom) {
        // Active: highlight this link
        item.link.style.color = "#0077b6";
        item.link.style.fontWeight = "700";
      } else {
        // Inactive: restore default colour
        item.link.style.color = "#555";
        item.link.style.fontWeight = "400";
      }
    });
  });


  /* ============================================================
   * 4. ANIMATED STAT COUNTERS
   *    The stats div shows "500K+", "150+", "25+".
   *    When scrolled into view, numbers count up from 0.
   *    Uses IntersectionObserver (no external libraries).
   * ============================================================ */

  // Map of the display text → numeric target
  var statData = [
    { display: "500K+", target: 500, suffix: "K+" },
    { display: "150+",  target: 150, suffix: "+"  },
    { display: "25+",   target: 25,  suffix: "+"  }
  ];

  // Select all <h2> elements inside the .stats section
  var statHeadings = document.querySelectorAll(".stats div h2");
  var statsAnimated = false; // make sure animation runs only once

  // Helper: animate one counter element from 0 → target
  function animateCounter(el, target, suffix, duration) {
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var current = Math.floor(progress * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix; // ensure exact final value
      }
    }

    requestAnimationFrame(step);
  }

  // IntersectionObserver watches when .stats enters the viewport
  var statsSection = document.querySelector(".stats");
  if (statsSection && statHeadings.length > 0) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;

            // Animate each stat heading
            statHeadings.forEach(function (el, index) {
              var data = statData[index];
              if (data) {
                animateCounter(el, data.target, data.suffix, 1800);
              }
            });
          }
        });
      },
      { threshold: 0.3 } // trigger when 30% of the section is visible
    );
    observer.observe(statsSection);
  }


  /* ============================================================
   * 5. "READ MORE" — ACTIVITY CARDS EXPAND / COLLAPSE
   *    Each button controls ONLY its own card using closest().
   *    Toggles a hidden .card-extra <div> — no text is replaced.
   *    Works correctly for all cards independently.
   * ============================================================ */

  document.querySelectorAll(".card-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      // closest() walks UP the DOM from this button to find its
      // own parent .card — it never touches any other card.
      var card = btn.closest(".card");
      if (!card) return;

      // querySelector() searches DOWN only inside that same card.
      var extra = card.querySelector(".card-extra");
      if (!extra) return;

      var isExpanded = !extra.hidden; // true if currently open

      if (isExpanded) {
        // Collapse: hide extra content
        extra.hidden = true;
        btn.textContent = "Read More";
      } else {
        // Expand: reveal extra content with fade-in animation
        extra.hidden = false;
        btn.textContent = "Read Less";
      }
    });
  });


  /* ============================================================
   * 6. VOLUNTEER "APPLY NOW" — GOOGLE FORM FLOW
   *    Clicking any "Apply Now" button:
   *      1. Opens the official Google Form in a new tab.
   *      2. Shows a temporary WhatsApp banner so the user knows
   *         to join the group after submitting the form.
   * ============================================================ */

  var GOOGLE_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSfAwfHyNY8YBN5a5nBZK1DYlcY2OjDssJoUUkIsY7zR6vO1sw/viewform?usp=dialog";
  var WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/JrAducKGlG43NAhYTFHWsG";

  // ---- Build once: WhatsApp confirmation banner ----
  var waBanner = document.createElement("div");
  waBanner.id = "wa-banner";
  Object.assign(waBanner.style, {
    display: "none",
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#ffffff",
    border: "2px solid #25D366",
    borderRadius: "14px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    padding: "20px 28px",
    zIndex: "10001",
    textAlign: "center",
    maxWidth: "360px",
    width: "90%",
    animation: "fadeSlideIn 0.3s ease"
  });

  waBanner.innerHTML =
    "<p style='margin:0 0 6px;font-weight:700;font-size:15px;color:#1a3b5d;'>" +
    "📋 Form opened in a new tab!</p>" +
    "<p style='margin:0 0 16px;font-size:13.5px;color:#555;line-height:1.5;'>" +
    "After submitting the form, join our WhatsApp group for updates.</p>" +
    "<a id='wa-join-btn' href='" + WHATSAPP_GROUP_URL + "' target='_blank' rel='noopener' " +
    "style='display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;" +
    "font-weight:700;font-size:14px;padding:10px 22px;border-radius:30px;text-decoration:none;" +
    "transition:background 0.2s;'>" +
    "<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white'>" +
    "<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15" +
    "-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475" +
    "-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52" +
    ".149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207" +
    "-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372" +
    "-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2" +
    " 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719" +
    " 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z'/>" +
    "<path d='M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.103 1.51 5.831L0 24l6.335-1.663" +
    "A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818" +
    "a9.817 9.817 0 01-5.007-1.37l-.36-.214-3.757.986.999-3.648-.232-.374" +
    "A9.818 9.818 0 012.182 12C2.182 6.58 6.579 2.182 12 2.182c5.42 0 9.818 4.398" +
    " 9.818 9.818 0 01-9.818 9.818z'/>" +
    "</svg>Join WhatsApp Group</a>" +
    "<br/><button id='wa-banner-close' style='margin-top:12px;background:none;border:none;" +
    "color:#888;font-size:12px;cursor:pointer;'>Dismiss</button>";

  document.body.appendChild(waBanner);

  // Dismiss button handler
  waBanner.querySelector("#wa-banner-close").addEventListener("click", function () {
    waBanner.style.display = "none";
  });

  // Helper: show the WhatsApp banner then auto-hide after 12 s
  function showWaBanner() {
    waBanner.style.display = "block";
    clearTimeout(waBanner._hideTimer);
    waBanner._hideTimer = setTimeout(function () {
      waBanner.style.display = "none";
    }, 12000);
  }

  // Wire each "Apply Now" button
  var volunteerBtns = document.querySelectorAll(".volunteer__btn");

  volunteerBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
      showWaBanner();
    });
  });

  // Expose for footer link (used in section 9)
  window._openVolunteerForm = function () {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
    showWaBanner();
  };


  /* ============================================================
   * 7. DONATE BUTTON MODAL
   *    Clicking the "Donate" button in the navigation opens
   *    a donation intention form. (Payment gateway integration
   *    can be added later by the backend team.)
   *    Fields: Name, Email, Amount, Message.
   * ============================================================ */
  var donateModal = buildModal("donate-modal", "Make a Donation 💛");

  var donateFormFields = [
    { id: "donate-name",    label: "Full Name",       type: "text",   placeholder: "Your full name",    required: true },
    { id: "donate-email",   label: "Email Address",   type: "email",  placeholder: "you@example.com",   required: true },
    { id: "donate-amount",  label: "Donation Amount (₹)", type: "number", placeholder: "e.g. 500",     required: true },
    { id: "donate-message", label: "Message (optional)", type: "textarea", placeholder: "Why you donate...", required: false }
  ];

  var donateForm = buildForm("donate-form", donateFormFields, "Proceed to Donate", function (formData) {
    var amount = formData["donate-amount"] || "0";
    showSuccessMsg(
      donateModal,
      "🙏 Thank You for Your Generosity!",
      "We've received your pledge of ₹" + amount + " from " +
      (formData["donate-name"] || "you") + ". Our team will contact you at " +
      (formData["donate-email"] || "your email") + " to complete the payment process."
    );
  });

  donateModal.querySelector(".modal-body").appendChild(donateForm);
  document.body.appendChild(donateModal);

  // Wire the nav Donate button
  var donateBtnNav = document.querySelector(".top-links .donate-btn");
  if (donateBtnNav) {
    donateBtnNav.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(donateModal);
    });
  }

  // Wire the footer "Make a Donation" link
  var footerLinks = document.querySelectorAll(".footer-box ul li a");
  footerLinks.forEach(function (link) {
    if (link.textContent.trim() === "Make a Donation") {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openModal(donateModal);
      });
    }
    if (link.textContent.trim() === "Volunteer") {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        window._openVolunteerForm();
      });
    }
  });


  /* ============================================================
   * 8. SCROLL-TO-TOP BUTTON
   *    A button is created and injected via JS that appears
   *    once the user scrolls past 400 px.
   *    Clicking it scrolls smoothly back to the top.
   * ============================================================ */
  var scrollTopBtn = document.createElement("button");
  scrollTopBtn.id = "scrollTopBtn";
  scrollTopBtn.textContent = "↑";
  scrollTopBtn.title = "Back to top";

  // Style entirely via JS (no CSS file / HTML changes)
  Object.assign(scrollTopBtn.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    zIndex: "9999",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: "#0077b6",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
    display: "none",        // hidden initially
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(0,119,182,0.4)",
    transition: "opacity 0.3s, transform 0.3s",
    opacity: "0"
  });

  document.body.appendChild(scrollTopBtn);

  window.addEventListener("scroll", function () {
    if (window.scrollY > 400) {
      scrollTopBtn.style.display = "flex";
      setTimeout(function () { scrollTopBtn.style.opacity = "1"; }, 10);
    } else {
      scrollTopBtn.style.opacity = "0";
      setTimeout(function () { scrollTopBtn.style.display = "none"; }, 300);
    }
  });

  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  scrollTopBtn.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-3px)";
    this.style.background = "#005f8e";
  });
  scrollTopBtn.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
    this.style.background = "#0077b6";
  });


  /* ============================================================
   * UTILITY FUNCTIONS
   *   buildModal()     — creates a reusable modal shell
   *   buildForm()      — creates a labeled form with validation
   *   openModal()      — shows modal + prevents body scroll
   *   closeModal()     — hides modal + restores body scroll
   *   showSuccessMsg() — replaces form with a success message
   * ============================================================ */

  /**
   * buildModal(id, title)
   * Creates and returns a full-screen modal overlay element.
   */
  function buildModal(id, title) {
    var overlay = document.createElement("div");
    overlay.id = id;

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.55)",
      zIndex: "10000",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    });

    var box = document.createElement("div");
    Object.assign(box.style, {
      background: "#ffffff",
      borderRadius: "14px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      animation: "fadeSlideIn 0.25s ease"
    });

    // Header row
    var header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px 0"
    });

    var titleEl = document.createElement("h2");
    titleEl.textContent = title;
    Object.assign(titleEl.style, {
      margin: "0",
      fontSize: "20px",
      color: "#102a43"
    });

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Close modal");
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      color: "#6b7c93",
      lineHeight: "1"
    });
    closeBtn.addEventListener("click", function () {
      closeModal(overlay);
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Body
    var body = document.createElement("div");
    body.className = "modal-body";
    Object.assign(body.style, { padding: "20px 24px 24px" });

    box.appendChild(header);
    box.appendChild(body);
    overlay.appendChild(box);

    // Close on backdrop click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal(overlay);
    });

    // Inject keyframe animation once
    if (!document.getElementById("modal-keyframe-style")) {
      var styleTag = document.createElement("style");
      styleTag.id = "modal-keyframe-style";
      styleTag.textContent =
        "@keyframes fadeSlideIn {" +
        "  from { opacity: 0; transform: translateY(-20px); }" +
        "  to   { opacity: 1; transform: translateY(0); }" +
        "}";
      document.head.appendChild(styleTag);
    }

    return overlay;
  }

  /**
   * buildForm(id, fields, submitLabel, onSuccess)
   * Builds a <form> element with labelled inputs and validation.
   * @param {string}   id          - unique form id
   * @param {Object[]} fields      - array of field descriptors
   * @param {string}   submitLabel - text for the submit button
   * @param {Function} onSuccess   - callback(formData) when valid
   */
  function buildForm(id, fields, submitLabel, onSuccess) {
    var form = document.createElement("form");
    form.id = id;
    form.noValidate = true; // we handle validation manually

    fields.forEach(function (field) {
      // Wrapper
      var wrapper = document.createElement("div");
      Object.assign(wrapper.style, { marginBottom: "16px" });

      // Label
      var label = document.createElement("label");
      label.setAttribute("for", field.id);
      label.textContent = field.label + (field.required ? " *" : "");
      Object.assign(label.style, {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "6px",
        color: "#102a43"
      });

      // Input or Textarea
      var input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 4;
        Object.assign(input.style, { resize: "vertical" });
      } else {
        input = document.createElement("input");
        input.type = field.type;
      }

      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || "";
      input.required = field.required || false;

      Object.assign(input.style, {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d0dce8",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#102a43",
        boxSizing: "border-box",
        outline: "none",
        transition: "border-color 0.2s"
      });

      // Focus and blur styles
      input.addEventListener("focus", function () {
        this.style.borderColor = "#0077b6";
      });
      input.addEventListener("blur", function () {
        this.style.borderColor = "#d0dce8";
      });

      // Inline error message placeholder
      var errorMsg = document.createElement("span");
      errorMsg.className = "field-error-" + field.id;
      Object.assign(errorMsg.style, {
        display: "none",
        color: "#e74c3c",
        fontSize: "12px",
        marginTop: "4px"
      });

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      wrapper.appendChild(errorMsg);
      form.appendChild(wrapper);
    });

    // Submit button
    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = submitLabel;
    Object.assign(submitBtn.style, {
      width: "100%",
      padding: "12px",
      background: "#2f9e63",
      color: "#ffffff",
      border: "none",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
      transition: "background 0.2s"
    });
    submitBtn.addEventListener("mouseenter", function () {
      this.style.background = "#278a55";
    });
    submitBtn.addEventListener("mouseleave", function () {
      this.style.background = "#2f9e63";
    });

    form.appendChild(submitBtn);

    // Form submission handler with manual validation
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var formData = {};

      fields.forEach(function (field) {
        var inputEl = form.querySelector("#" + field.id);
        var errorEl = form.querySelector(".field-error-" + field.id);
        var val = inputEl ? inputEl.value.trim() : "";

        // Clear previous error
        if (errorEl) {
          errorEl.style.display = "none";
          errorEl.textContent = "";
        }
        if (inputEl) {
          inputEl.style.borderColor = "#d0dce8";
        }

        // Required check
        if (field.required && !val) {
          valid = false;
          if (errorEl) {
            errorEl.textContent = field.label + " is required.";
            errorEl.style.display = "block";
          }
          if (inputEl) inputEl.style.borderColor = "#e74c3c";
        }

        // Email format check
        if (field.type === "email" && val) {
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            valid = false;
            if (errorEl) {
              errorEl.textContent = "Please enter a valid email address.";
              errorEl.style.display = "block";
            }
            if (inputEl) inputEl.style.borderColor = "#e74c3c";
          }
        }

        // Phone format check (basic)
        if (field.type === "tel" && val) {
          var phoneRegex = /^[+\d\s\-()]{7,15}$/;
          if (!phoneRegex.test(val)) {
            valid = false;
            if (errorEl) {
              errorEl.textContent = "Please enter a valid phone number.";
              errorEl.style.display = "block";
            }
            if (inputEl) inputEl.style.borderColor = "#e74c3c";
          }
        }

        // Number check for donation amount
        if (field.type === "number" && val) {
          if (isNaN(val) || Number(val) <= 0) {
            valid = false;
            if (errorEl) {
              errorEl.textContent = "Please enter a valid positive amount.";
              errorEl.style.display = "block";
            }
            if (inputEl) inputEl.style.borderColor = "#e74c3c";
          }
        }

        formData[field.id] = val;
      });

      if (valid) {
        // Reset form and call the success callback
        form.reset();
        onSuccess(formData);
      }
    });

    return form;
  }

  /**
   * openModal(modal)
   * Shows the modal overlay and prevents body from scrolling.
   */
  function openModal(modal) {
    // Hide any success messages from previous opens
    var successDiv = modal.querySelector(".modal-success");
    var formEl = modal.querySelector("form");
    if (successDiv) successDiv.style.display = "none";
    if (formEl)     formEl.style.display = "block";

    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // prevent background scroll
  }

  /**
   * closeModal(modal)
   * Hides the modal overlay and restores body scrolling.
   */
  function closeModal(modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  /**
   * showSuccessMsg(modal, title, message)
   * Hides the form inside a modal and shows a success confirmation.
   */
  function showSuccessMsg(modal, title, message) {
    var formEl = modal.querySelector("form");
    if (formEl) formEl.style.display = "none";

    // Reuse or create the success div
    var successDiv = modal.querySelector(".modal-success");
    if (!successDiv) {
      successDiv = document.createElement("div");
      successDiv.className = "modal-success";
      Object.assign(successDiv.style, {
        textAlign: "center",
        padding: "20px 10px"
      });
      modal.querySelector(".modal-body").appendChild(successDiv);
    }

    successDiv.innerHTML = "";

    var titleEl = document.createElement("h3");
    titleEl.textContent = title;
    Object.assign(titleEl.style, { color: "#2f9e63", marginBottom: "12px", fontSize: "18px" });

    var msgEl = document.createElement("p");
    msgEl.textContent = message;
    Object.assign(msgEl.style, { color: "#4b5b70", lineHeight: "1.6", fontSize: "14px" });

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    Object.assign(closeBtn.style, {
      marginTop: "20px",
      padding: "10px 28px",
      background: "#0077b6",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px"
    });
    closeBtn.addEventListener("click", function () {
      closeModal(modal);
    });

    successDiv.appendChild(titleEl);
    successDiv.appendChild(msgEl);
    successDiv.appendChild(closeBtn);
    successDiv.style.display = "block";
  }

}); // end DOMContentLoaded
