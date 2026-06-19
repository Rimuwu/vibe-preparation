import { ref } from 'vue';

// Centralized reactive states (singleton pattern, shared by all imports)
const modal = ref({
  visible: false,
  title: '',
  type: 'alert',
  message: '',
  defaultValue: '',
  questionData: {},
  resolve: null
});

const shareCard = ref({
  visible: false,
  imgUrl: '',
  canvas: null,
  copyText: 'Копировать'
});

export function useModal() {
  console.log('[useModal] Instantiated composable');

  const showAlert = ({ title, message }) => {
    console.log('[useModal] showAlert called', { title, message });
    return new Promise((resolve) => {
      modal.value = {
        visible: true,
        title: title || 'Внимание',
        type: 'alert',
        message: message || '',
        defaultValue: '',
        questionData: {},
        resolve
      };
      console.log('[useModal] modal state updated to', modal.value);
    });
  };

  const showConfirm = ({ title, message }) => {
    console.log('[useModal] showConfirm called', { title, message });
    return new Promise((resolve) => {
      modal.value = {
        visible: true,
        title: title || 'Подтверждение',
        type: 'confirm',
        message: message || '',
        defaultValue: '',
        questionData: {},
        resolve
      };
      console.log('[useModal] modal state updated to', modal.value);
    });
  };

  const showPrompt = ({ title, message, defaultValue }) => {
    console.log('[useModal] showPrompt called', { title, message, defaultValue });
    return new Promise((resolve) => {
      modal.value = {
        visible: true,
        title: title || 'Ввод',
        type: 'prompt',
        message: message || '',
        defaultValue: defaultValue || '',
        questionData: {},
        resolve
      };
      console.log('[useModal] modal state updated to', modal.value);
    });
  };

  const showEditQuestion = ({ question }) => {
    console.log('[useModal] showEditQuestion called', { question });
    return new Promise((resolve) => {
      modal.value = {
        visible: true,
        title: question.isNew ? 'Добавить вопрос' : 'Редактировать вопрос/ответ',
        type: 'edit-question',
        message: '',
        defaultValue: '',
        questionData: question,
        resolve
      };
      console.log('[useModal] modal state updated to', modal.value);
    });
  };

  const showShareCard = ({ imgUrl, canvas }) => {
    console.log('[useModal] showShareCard called', { imgUrl, canvas });
    shareCard.value = {
      visible: true,
      imgUrl,
      canvas,
      copyText: 'Копировать'
    };
    console.log('[useModal] shareCard state updated to', shareCard.value);
  };

  const onModalCancel = () => {
    console.log('[useModal] onModalCancel called');
    const resolveFn = modal.value.resolve;
    modal.value.visible = false;
    modal.value.resolve = null;
    if (resolveFn) {
      console.log('[useModal] Resolving modal promise with null');
      resolveFn(null);
    }
  };

  const onModalOk = (payload) => {
    console.log('[useModal] onModalOk called with payload:', payload);
    const resolveFn = modal.value.resolve;
    modal.value.visible = false;
    modal.value.resolve = null;
    if (resolveFn) {
      const val = payload || true;
      console.log('[useModal] Resolving modal promise with:', val);
      resolveFn(val);
    }
  };

  return {
    modal,
    shareCard,
    showAlert,
    showConfirm,
    showPrompt,
    showEditQuestion,
    showShareCard,
    onModalCancel,
    onModalOk
  };
}
