import { EnvKeys } from 'src/types/common/EnvKeys.enum';

export const getEnvKeysFromFile = (): { [key in EnvKeys]: EnvKeys } => {
  return Object.keys(process.env).reduce(
    (acc, key) => {
      acc[key] = key;
      return acc;
    },
    {} as { [key in EnvKeys]: EnvKeys },
  );
};
