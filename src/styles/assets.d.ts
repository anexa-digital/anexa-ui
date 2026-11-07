// Font files are imported as URLs (Bun's file loader emits them with hashed names).
declare module "*.woff2" {
  const url: string;
  export default url;
}
