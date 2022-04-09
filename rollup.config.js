import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/gammonground.js',
      format: 'iife',
      name: 'Gammonground',
    },
    {
      file: 'dist/gammonground.min.js',
      format: 'iife',
      name: 'Gammonground',
      plugins: [
        terser(),
      ],
    },
  ],
  plugins: [
    typescript(),
  ],
};
