import { getEnvKeysFromFile } from './get-env-keys-from-file.function';
import { getEnvEnumKeys } from './get-env-enum-keys.function';
import { EnvKeys } from 'src/common/types/EnvKeys.enum';

export const assertNoMissingEnvVariables = () => {
  const envKeys = getEnvKeysFromFile();
  const missingKeys: EnvKeys[] = [];
  Object.keys(getEnvEnumKeys()).forEach((key: EnvKeys) => {
    if (!envKeys[key]) {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    const errorMessage = `Missing environment variables: ${missingKeys.join(', ')}`;
    console.error('\x1b[31m%s\x1b[0m', errorMessage);
    throw new Error(errorMessage);
  }
};
