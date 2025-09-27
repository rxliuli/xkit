interface AnalysisErrorProps {
  error: string;
}

export function AnalysisError({ error }: AnalysisErrorProps) {
  if (!error) return null;

  const buildErrorMessage = (error: string) => {
    if (error.includes("https://chromewebstore.google.com")) {
      return (
        <div>
          {error.split("https://chromewebstore.google.com")[0]}
          <a
            href="https://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 break-words"
          >
            https://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh
          </a>
          {
            error.split(
              "https://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh"
            )[1]
          }
        </div>
      );
    }
    return error;
  };

  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 text-sm whitespace-pre-line">
        {buildErrorMessage(error)}
      </div>
    </div>
  );
}
