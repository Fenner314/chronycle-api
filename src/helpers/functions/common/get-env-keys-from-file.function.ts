import { EnvKeys } from 'src/common/types/EnvKeys.enum';

export const getEnvKeysFromFile = (): { [key in EnvKeys]: EnvKeys } => {
  return Object.keys(process.env).reduce(
    (acc, key) => {
      acc[key] = key;
      return acc;
    },
    {} as { [key in EnvKeys]: EnvKeys },
  );
};
