import * as colors from '@std/fmt/colors';
import { MsgBuilder } from './builder.ts';

type ColorFn = (str: string) => string;
const colorNames: (keyof typeof colors)[] = [
  'blue',
  'green',
  'yellow',
  'red',
  'cyan',
  'magenta',
  'white',
  'gray',
];

const builder = new MsgBuilder('INFO');
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

colorNames.forEach((colorName) => {
  const brightColorName = bright(colorName);
  const bgColorName = bg(colorName);
  const colorFn: ColorFn = colors[colorName] as ColorFn;
  const brightColorFn: ColorFn = colors[brightColorName] as ColorFn;
  const bgColorFn: ColorFn = colors[bgColorName] as ColorFn;
  console.log(
    [
      colors.bold(colorFn('bold ' + colorName)),
      colorFn(colorName),
      brightColorFn(bright(colorName)),
      colors.bold(brightColorFn('bold ' + bright(colorName))),
      colors.inverse(colorFn(`inverse ${colorName}`)),
      colors.underline(colorFn(`underline ${colorName}`)),
      colors.italic(colorFn(`italic ${colorName}`)),
      bgColorFn(colorFn(`bg ${colorName}`)),
    ].join(', '),
  );
  console.log();
  const line1: string[] = [];
  const line2: string[] = [];
  colorNames.forEach((colorName2) => {
    const bgColorName = bg(colorName2);
    const bgColorBrightName = bg(bright(colorName2));
    const bgColorFn2: ColorFn = colors[bgColorName] as ColorFn;
    const bgColorBrightFn: ColorFn = colors[bgColorBrightName] as ColorFn;
    line1.push(bgColorFn2(colorFn(`${colorName} ${bgColorName}`)));
    line2.push(bgColorBrightFn(brightColorFn(`${brightColorName} ${bgColorBrightName}`)));
  });
  console.log(line1.join(', '));
  console.log();
  console.log(line2.join(', '));
  console.log();
});

function bright(str: string): keyof typeof colors {
  if (str === 'gray') {
    return 'gray';
  }
  return ('bright' + str.charAt(0).toUpperCase() + str.slice(1)) as keyof typeof colors;
}

function bg(str: string): keyof typeof colors {
  if (str === 'gray') {
    return 'gray';
  }
  return ('bg' + str.charAt(0).toUpperCase() + str.slice(1)) as keyof typeof colors;
}
