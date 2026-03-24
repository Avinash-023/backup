import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, Download, MapPin, X } from "lucide-react";
import { searchStudentApi, type StudentSearchResult } from "@/services/api";

export default function StudentPortalPage() {
  const [regNo, setRegNo] = useState("");
  const [result, setResult] = useState<StudentSearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!regNo.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchStudentApi(regNo);
      setResult(res);
    } catch (e) {
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-foreground/10">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-primary-foreground">Seat Finder</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground">Find your examination venue</p>

        {/* Search */}
        <div className="flex items-center gap-0 card-elevated overflow-hidden">
          <input
            type="text"
            value={regNo}
            onChange={e => setRegNo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Register Number"
            className="flex-1 px-4 py-4 text-sm bg-transparent focus:outline-none"
          />
          <button onClick={handleSearch} className="flex h-full items-center justify-center bg-primary px-5 py-4 hover:bg-primary/90 transition-colors">
            <Search className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>

        <AnimatePresence>
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-sm text-muted-foreground animate-pulse">
              Searching for student register number...
            </motion.div>
          ) : searched && result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="space-y-4"
            >
              {/* Exam Details Card */}
              <div className="card-elevated overflow-hidden outline outline-2 outline-primary/20">
                <div className="bg-primary/5 px-5 py-2">
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">Examination Details</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Exam Date</p>
                      <p className="text-sm font-semibold mt-1">{result.examDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Time</p>
                      <p className="text-sm font-semibold mt-1">{result.time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Subject Name</p>
                    <p className="text-sm font-semibold mt-1">{result.subjectName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Hall / Building</p>
                      <p className="text-sm font-semibold mt-1">{result.hallBuilding}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Seat Code</p>
                      <p className="text-lg font-bold text-primary font-mono mt-0.5">{result.seatCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Seat Map */}
              <div className="card-elevated p-5 sm:p-6 overflow-hidden">
                <p className="text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Exact Seat Location Map</p>
                <div className="rounded-xl border border-border bg-secondary/10 p-4 sm:p-6 overflow-x-auto relative shadow-inner">
                  <div className="min-w-max flex flex-col items-center">
                    
                    {/* Board / Teacher */}
                    <div className="mb-8 w-1/2 max-w-[200px] rounded-b-lg border-b-4 border-muted-foreground/30 bg-muted/40 px-6 py-2 text-center shadow-sm">
                      <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">Board / Teacher</span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {Array.from({ length: result.totalRows }, (_, r) => (
                        <div key={r} className="flex items-center gap-2 sm:gap-4">
                          {/* Row Label */}
                          <div className="w-10 text-right text-[10px] sm:text-xs font-semibold text-muted-foreground font-mono">
                            Row {r + 1}
                          </div>

                          {/* Benches */}
                          {Array.from({ length: result.totalCols }, (_, c) => {
                            const isMyBench = r === result.seatRow && c === result.seatCol;
                            const isMyLeft = isMyBench && result.position === 'L';
                            const isMyRight = isMyBench && result.position === 'R';

                            return (
                              <div key={c} className="flex gap-0.5 sm:gap-1">
                                {/* Left Seat */}
                                <div
                                  className={`flex h-9 w-[40px] sm:h-12 sm:w-[50px] flex-col items-center justify-center rounded-l-md text-[9px] sm:text-[10px] font-mono transition-all duration-300 ${
                                    isMyLeft
                                      ? 'bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary ring-offset-1 z-10 scale-110'
                                      : 'bg-black text-white/40 border border-black border-r-0'
                                  }`}
                                >
                                  {isMyLeft ? <span>{result.seatCode}</span> : <X className="h-4 w-4 opacity-50"/>}
                                </div>
                                
                                {/* Right Seat */}
                                <div
                                  className={`flex h-9 w-[40px] sm:h-12 sm:w-[50px] flex-col items-center justify-center rounded-r-md text-[9px] sm:text-[10px] font-mono transition-all duration-300 ${
                                    isMyRight
                                      ? 'bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary ring-offset-1 z-10 scale-110'
                                      : 'bg-black text-white/40 border border-black border-l-0'
                                  }`}
                                >
                                  {isMyRight ? <span>{result.seatCode}</span> : <X className="h-4 w-4 opacity-50"/>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex w-full justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4">
                      <span>&larr; Entrance</span>
                      <span>Exit &rarr;</span>
                    </div>

                  </div>
                </div>
              </div>

            </motion.div>
          ) : searched && !result && !loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-sm text-muted-foreground">
              No results found. Please check your register number.
            </motion.div>
          ) : null}
        </AnimatePresence>

        <footer className="text-center pt-8 text-xs text-muted-foreground space-y-1">
          <p>© 2024 Institutional Examination Board</p>
          <p>For assistance, contact the controller's office.</p>
        </footer>
      </main>
    </div>
  );
}
