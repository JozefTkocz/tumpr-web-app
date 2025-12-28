import React from "react";

type ErrorBoundaryProps = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log(error, info);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function ErrorPage() {
  return <p>There was an error</p>;
}

export function DefaultErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary fallback={ErrorPage()}>{children}</ErrorBoundary>;
}
