import * as colors from '@std/fmt/colors';
import { MsgBuilder } from './mod.ts';

const builder = new MsgBuilder();
const result = builder
  .h1('Heading 1')
  .h2('Heading 2')
  .h3('Heading 3')
  .action('Action')
  .label('Label')
  .highlight('Highlight')
  .value('Value')
  .path('path')
  .date('date')
  .strikethru('strikethru')
  .warn('warn')
  .error('error')
  .emit();
console.log(result);
['blue', 'green', 'yellow', 'red', 'cyan', 'magenta', 'white', 'gray'].forEach((color: string) => {
  const colorFn = colors[color];
  const brightColorFn = colors[bright(color)];
  const bgColorFn = colors[bg(color)];
  console.log(
    [
      colors.bold(colorFn('bold ' + color)),
      colorFn(color),
      brightColorFn(bright(color)),
      colors.bold(brightColorFn('bold ' + bright(color))),
    ].join(', ')
  );
  console.log(
    [
      colors.inverse(colorFn(`inverse ${color}`)),
      colors.underline(colorFn(`underline ${color}`)),
      colors.italic(colorFn(`italic ${color}`)),
      bgColorFn(colorFn(`bg ${color}`)),
    ].join(', ')
  );
});

function bright(str: string): string {
  if (str === 'gray') {
    return 'gray';
  }
  return 'bright' + str.charAt(0).toUpperCase() + str.slice(1);
}

function bg(str: string): string {
  if (str === 'gray') {
    return 'gray';
  }
  return 'bg' + str.charAt(0).toUpperCase() + str.slice(1);
}
