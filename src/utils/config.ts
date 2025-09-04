import { Config, ConfigSchema } from '../types/index.js';
import { config as dotenvConfig } from 'dotenv';

export function loadConfig(): Config {
  // Load environment variables from .env file
  dotenvConfig();

  const configData = {
    wikijs_api_url: process.env.WIKIJS_API_URL,
    wikijs_token: process.env.WIKIJS_TOKEN,
    wikijs_username: process.env.WIKIJS_USERNAME,
    wikijs_password: process.env.WIKIJS_PASSWORD,
    log_level: process.env.LOG_LEVEL || 'INFO',
    default_space_name: process.env.DEFAULT_SPACE_NAME || 'Documentation',
    repository_root: process.env.REPOSITORY_ROOT || './',
  };

  // Validate configuration
  const result = ConfigSchema.safeParse(configData);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Validate authentication
  if (!result.data.wikijs_token && (!result.data.wikijs_username || !result.data.wikijs_password)) {
    throw new Error('Either WIKIJS_TOKEN or both WIKIJS_USERNAME and WIKIJS_PASSWORD must be provided');
  }

  return result.data;
}

export function validateConfig(config: Partial<Config>): Config {
  const result = ConfigSchema.safeParse(config);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}