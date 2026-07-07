export const onRequest = async (context) => {
  try {
    const response = await fetch(new URL('/admin/index.html', context.request.url));
    if (!response.ok) {
      return new Response('Admin panel not found', { status: 404 });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response('Error loading admin panel: ' + error.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};
