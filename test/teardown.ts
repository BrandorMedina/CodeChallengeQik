export default async function () {
  // Forzar cierre de todo lo que quede abierto
  await new Promise((resolve) => setTimeout(resolve, 500));
}