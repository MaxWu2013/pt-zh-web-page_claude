import './ErrorBoundary.scoped.css';
import { Component } from 'react';
import imgError3 from './error2.svg';

export default class ErrorBoundary extends Component<{ env?: object }> {
	state: { errorMessage: null | string } = {
		errorMessage: null,
	};

	static getDerivedStateFromError(error: Error) {
		return { errorMessage: error.message };
	}

	componentDidCatch(error: Error, errorInfo: any) {
		console.log(error, errorInfo);
	}

	render() {
		const { errorMessage } = this.state;
		const { children, env } = this.props;
		if (errorMessage) {
			return (
				<div className="page">
					<img src={imgError3} alt="" />
					<span>Something went wrong!</span>
					<p>{decodeURIComponent(errorMessage)}</p>
					{env && (
						<div className="env">
							{Object.keys(env).map((keyItem) => {
								return (
									<div key={keyItem}>
										<i> {keyItem}</i>:<strong> {`${env[keyItem as keyof typeof env]}`}</strong>
									</div>
								);
							})}
							<div>
								<i>href</i>:<strong>{window.location.href}</strong>
							</div>
						</div>
					)}
				</div>
			);
		}
		return children;
	}
}
