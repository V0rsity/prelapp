interface MorningOverviewProps {
  currentDate: string;
}

export default function MorningOverview({currentDate}: MorningOverviewProps) {
  return (
    <div className="morning-overview main-container">
      <div className="main-heading">
        <h1>Morning Overview</h1>
        <h3>Based on how you feel.</h3>
      </div>
    </div>
  );
}