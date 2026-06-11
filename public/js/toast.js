/* =====================================================================
   Dramova · Toast bridge
   Routes legacy window.DramSi.toast calls into the app shadcn/Radix toaster.
   ===================================================================== */
(function () {
  'use strict';

  function id() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function emit(type, title, options = {}) {
    const toastId = options.id || id();
    const detail = {
      id: toastId,
      nonce: Date.now(),
      title: String(title || ''),
      description: options.description,
      kind: type,
      duration: options.duration || (type === 'loading' ? 100000 : 3200),
    };
    window.dispatchEvent(new CustomEvent('dramova:toast', { detail }));
    return {
      id: toastId,
      update(message, updateOptions = {}) {
        return emit(updateOptions.type || type, message, { ...options, ...updateOptions, id: toastId });
      },
      dismiss() {
        window.dispatchEvent(new CustomEvent('dramova:toast-dismiss', { detail: { id: toastId } }));
      },
    };
  }

  const toast = {
    success(message, options) { return emit('success', message, options); },
    error(message, options) { return emit('error', message, options); },
    warning(message, options) { return emit('warning', message, options); },
    info(message, options) { return emit('info', message, options); },
    loading(message, options) { return emit('loading', message, options); },
  };

  window.DramSi = window.DramSi || {};
  window.DramSi.toast = toast;
})();
