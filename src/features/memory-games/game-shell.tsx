import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./memory-games.module.css";

export function GamePageShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>Kilig &amp; Co. ♡</Link>
          <nav className={styles.topLinks} aria-label="Memory game navigation">
            <Link href="/">Back to our story</Link>
            <Link href="/games">All games</Link>
          </nav>
        </header>
        <nav className={styles.gameNav} aria-label="Choose another game">
          <Link href="/games/lost-little-girl">Lost Little Girl</Link>
          <Link href="/games/date-detective">Date Detective</Link>
          <Link href="/games/memory-crossword">Memory Crossword</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
