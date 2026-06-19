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
  const showAlert = ({ title, message }) => {
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
    });
  };

  const showConfirm = ({ title, message }) => {
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
    });
  };

  const showPrompt = ({ title, message, defaultValue }) => {
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
    });
  };

  const showEditQuestion = ({ question }) => {
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
    });
  };

  const showShareCard = ({ imgUrl, canvas }) => {
    shareCard.value = {
      visible: true,
      imgUrl,
      canvas,
      copyText: 'Копировать'
    };
  };

  const showPromptTextarea = ({ title, message, defaultValue }) => {
    return new Promise((resolve) => {
      modal.value = {
        visible: true,
        title: title || 'Ввод текста',
        type: 'prompt-textarea',
        message: message || '',
        defaultValue: defaultValue || '',
        questionData: {},
        resolve
      };
    });
  };

  const onModalCancel = () => {
    const resolveFn = modal.value.resolve;
    modal.value.visible = false;
    modal.value.resolve = null;
    if (resolveFn) resolveFn(null);
  };

  const onModalOk = (payload) => {
    const resolveFn = modal.value.resolve;
    modal.value.visible = false;
    modal.value.resolve = null;
    if (resolveFn) resolveFn(payload || true);
  };

  return {
    modal,
    shareCard,
    showAlert,
    showConfirm,
    showPrompt,
    showPromptTextarea,
    showEditQuestion,
    showShareCard,
    onModalCancel,
    onModalOk
  };
}
