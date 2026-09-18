import { App } from './app/App';

new App().start().catch((error) => {
  console.error(error);
  const loading = document.querySelector('.loading-world');
  if (loading) {
    loading.innerHTML = '<strong>小院暂时没有打开</strong><span>请刷新页面，再试一次。</span>';
  }
});
