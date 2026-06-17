# Инструкция по деплою бэкенда на Vercel

Этот бэкенд на FastAPI полностью готов для развертывания на Vercel. Следуйте шагам ниже, чтобы опубликовать его.

## Вариант 1: Деплой всей папки backend (рекомендуется)

1. Установите Vercel CLI (если еще не установлен):
   ```bash
   npm install -g vercel
   ```
2. Перейдите в папку `backend`:
   ```bash
   cd backend
   ```
3. Войдите в аккаунт Vercel и запустите деплой:
   ```bash
   vercel login
   vercel
   ```
   *Следуйте инструкциям в консоли. На все вопросы можно ответить по умолчанию.*
4. Перейдите на [Vercel Dashboard](https://vercel.com/dashboard) в созданный проект.
5. Откройте **Settings -> Environment Variables** и добавьте переменную:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://`
6. Передеплойте приложение с помощью `vercel --prod`, чтобы применить переменные окружения:
   ```bash
   vercel --prod
   ```
7. Вы получите URL бэкенда (например, `https://vibe-prep-backend.vercel.app`). Скопируйте его и укажите в файле `.env` в корневой папке фронтенда:
   ```env
   API_URL=https://vibe-prep-backend.vercel.app
   ```

---

## Вариант 2: Деплой через GitHub (автодеплой)

1. Залейте весь ваш репозиторий на GitHub.
2. Подключите репозиторий в [Vercel Dashboard](https://vercel.com/dashboard).
3. При импорте проекта настройте следующие параметры:
   - **Root Directory**: Укажите `backend`.
   - **Framework Preset**: Выберите **Other** (или Vercel сам определит Python).
4. Во вкладке **Environment Variables** добавьте:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://`
5. Нажмите **Deploy**. Проект будет собираться и автоматически обновляться при каждом пуше в ветку `main`.
