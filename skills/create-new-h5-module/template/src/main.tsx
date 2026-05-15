'skip scanner';

import './index.scss';
import { render } from 'react-dom';
import { getQuery } from '@ola/utils';
import ola, { setOla } from '/src/ola';
import setReport from '/src/common/setReport';
import setConsole from '/src/common/setConsole';
import setLocale from '/src/common/setLocale';
import setSentry from '/src/common/setSentry';
import '/src/common/utils/string_formatter.d';
// import 'virtual:windi.css';
import 'virtual:uno.css';

const el = document.getElementById('root') as HTMLElement;

async function setup() {
	setSentry();
	setConsole();
	setReport();
	await setOla();
	if (ola.app.config.channel !== 'oversea') return;
	const lanParam = getQuery('lan')?.toLowerCase()?.replace('-', '_');
	const lan = await setLocale(lanParam || ola.user.lan, 'zh_tw');
	el.classList.add(lan);
	el.classList.add('root');
}

setup()
	.then(async () => {
		const { App } = await import('./App');
		render(<App />, el);
		if (!document.title) console.warn('请设置页面标题');
	})
	.catch((err) => {
		render(<div>{(err as Error).message}</div>, el);
	});
