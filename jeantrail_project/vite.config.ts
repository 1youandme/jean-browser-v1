import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // تمكين Fast Refresh وميزات React الحديثة
      jsxRuntime: 'automatic',
    }),
  ],
  
  // تحديد جذر المشروع حيث يوجد index.html
  root: '.',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // للوصول لمجلد src بسهولة
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'], // دعم الملفات الشائعة
  },

  server: {
    port: 5174,        // المنفذ المراد تشغيله
    strictPort: true,  // لا يحاول Vite تغيير المنفذ تلقائياً
    open: true,        // يفتح المتصفح تلقائياً عند التشغيل
    host: 'localhost', // لتشغيل على localhost
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/index.css";` // دعم استيراد CSS أو SCSS العام
      }
    }
  },

  build: {
    outDir: 'dist',   // مجلد الإخراج بعد البناء
    sourcemap: true,  // تمكين الخرائط لتسهيل تصحيح الأخطاء
  },

  optimizeDeps: {
    include: ['react', 'react-dom'], // تحسين تحميل React
  },
});
