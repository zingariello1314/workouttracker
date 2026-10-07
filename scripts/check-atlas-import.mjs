import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
try {
  await server.ssrLoadModule('/src/components/tabs/AnatomyTab/atlas/AnatomyAtlasView.jsx');
  console.log('AnatomyAtlasView OK');
} finally {
  await server.close();
}
