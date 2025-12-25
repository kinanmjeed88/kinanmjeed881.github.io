interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string;
  // add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.json" {
  const value: any;
  export default value;
}