import { bankMediaUrl, circuitList } from '../../sport/BankLinkedMedia';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Film } from 'lucide-react';

export default function CircuitsBankView() {
  const circuits = circuitList();

  return (
    <div className="space-y-4">
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Film className="w-5 h-5 text-teal-300" />
            Circuits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            {circuits.length} routines vidéo. La liste des exercices de chaque circuit viendra ensuite, à partir de la vidéo, pas du nom du fichier.
          </p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {circuits.map((circuit) => (
          <Card key={circuit.mediaId} variant="sport">
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-white">{circuit.title}</h3>
              <video
                src={bankMediaUrl(circuit.sourcePath)}
                className="mx-auto block h-auto w-auto max-h-[70vh] max-w-full rounded-xl"
                controls
                playsInline
                preload="metadata"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
