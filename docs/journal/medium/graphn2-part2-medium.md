# I Rebuilt the Calculator That Got Me Through Engineering School (Part 2 of 3)

*The honest hours it took, and the three bugs, a wandering cursor, a
stubborn root-finder, an impossible surface, that taught me the most.*

*This is Part 2 of a three-part series on building GraphN², a full-featured
graphing scientific calculator in the browser, working with Claude. Part 1
covered why it exists, what it does, and the architecture and collaboration
model underneath it. This part covers how the project actually got run day
to day, the honest numbers on speed and resource cost, and the three hardest
technical problems I hit along the way. Part 3 covers testing, shipping, and
why this matters to me personally.*

---

## 6. Running the Project, Not Just the Code

There's a subtler piece of the collaboration worth calling out on its own.
Early on, I threw out a lot of ambitious ideas, 3D plotting, Karnaugh map
minimization, making the whole thing installable as an app, before the core
calculator even worked. Deciding which of those were real priorities and
which were stretch goals to park for later was mine to call, not Claude's.
What Claude actually contributed was the unglamorous part: holding onto
that whole list across a long conversation and surfacing each idea again
once the foundation was solid enough to build on, instead of it quietly
falling off my radar while I was heads-down on whatever mattered that day.
I didn't have to keep a running list in a notebook or remember to circle
back, the bookkeeping just happened. Some sessions I wanted to think two
years out about what this thing could become, other sessions I just wanted
the DEL key to work right, and the collaboration flexed to match whichever
mode I was actually in that day.

It also went both ways. There were moments Claude pushed back on scope I
was about to take on too early, and moments I pushed back until an
architecture suggestion was explained well enough for me to actually agree
with it. A lot of that second kind of pushback had a specific shape:
refusing to let the software quietly inherit a physical calculator's
limits just because that's what a calculator has always looked like.
Equation and polynomial degree, matrix and vector dimensions, the number
of rows in a stats set, five predictors in regression instead of the two
or three most hardware supports, Karnaugh maps up to eight variables instead of the four a physical
calculator typically caps out at, more than one graph on screen at once
instead of the single view most hardware locks you into, a history that doesn't quietly drop old entries once memory
runs out, decimal precision that isn't squeezed down to fit a fixed number
of LCD characters, more stored graph functions than the Y1 through Y9 most
hardware allows, base-N integers that aren't locked to a fixed register
width. None of those limits exist because the math demands them, they
exist on real hardware because of fixed memory and a tiny screen, and
neither of those constraints is real once the thing is running in a
browser.

One of those decisions wasn't about expanding a limit at all, it was
fixing an ambiguity real hardware just lives with. Physical calculators
typically let A through F mean either a stored variable or a hex digit,
resolved only by which mode you happen to be in. Ours uses K through T for
memory variables instead, so a variable name and a hex digit are never the
same character to begin with, no mode-dependent guessing required.

That back and forth, catching an inherited assumption before it became a
silent ceiling on the software, is what made it feel like working with a
project partner rather than a one-way instruction pipeline, and it's the
part of this workflow I'd most want other builders to try, not just the
speed. Every one of those stretch goals shipped in the end: Karnaugh map
minimization, full 3D plotting with WebGL, PWA installability. None of it
would have happened in a single sitting if I'd tried to hold the entire
roadmap in my own head.

That roadmap wasn't just in my head to begin with, either. The whole
project got organized into actual phases, tracked in a running roadmap
document rather than floating around loose in conversation, roughly: get
the core calc engine right, then graphing, then the rest of the modes,
then the harder stretch goals once the foundation could support them. It's
a small thing to call out, but it's the difference between a project that
was planned and one that was just improvised for three days straight, and
it's the same incremental-delivery discipline any engineering team uses to
ship something large without losing track of what's done, what's next, and
what's deliberately not built yet.

The documentation stayed part of that discipline too, not an afterthought
bolted on once the code was "done." A phases doc that tracks what shipped
in which phase, a user manual that documents the actual key sequences,
these got updated in the same pull requests as the features they describe,
not in some separate cleanup pass that realistically never happens. Docs
that lag the code are worse than no docs, they actively lie to whoever
reads them next, including future me.

None of those ideas came from nowhere, either. Years of working as a
software engineer and years before that in electronics labs gave me a
mental library of interaction patterns to draw on, and a good chunk of the
ideation was really about recognizing which of those already solved the
problem in front of me. The trace cursor on the graph is a good example.
That idea was mine, and it didn't come from another piece of software at
all, it came from a cathode ray oscilloscope in an electronics lab, lock a
line across the screen and read two waveforms against the same reference
point, and from flight simulator cockpit gauges, a fixed marker you judge
a moving value against. Once I was looking at a plotted curve on a screen
again, that same instinct was just obviously the right way to read values
off it. The ability to show, hide, split, and combine multiple graphs on
screen at once was mine too, once one graph could be trusted, the obvious
next question was what happens when you need to compare two. Recognizing
a good pattern from a completely different domain and reshaping it for
this one is one of the underrated perks of having spent real time in a lab
before ever writing a line of this project's code.

---

## 7. The Honest Numbers

Speed is usually the first thing people ask about, so it's worth being
precise instead of impressive. A calculator with this much scope, 3D
graphing, Karnaugh map minimization, matrices, statistics, equation
solving, 700-plus tests, deployed and instrumented, would typically take a
solo engineer several weeks of focused work. With Claude handling
boilerplate and well-specified pieces while I stayed on architecture,
scope, and every bug that only shows up once a human is actually using the
thing, that compressed to three days, six to ten hours each. That's the
number worth stating precisely rather than rounding up for effect,
especially for readers who'll recognize the scope and know roughly what it
should cost.

Wall-clock time wasn't the only budget I was watching, either. A project
this size runs through a genuinely large amount of AI usage, and staying
deliberate about that instead of burning through it carelessly was its own
trade-off, closer to watching cloud spend or query cost on any real system
than people usually give it credit for. That's the same instinct as
knowing when a fix is good enough to ship versus when it's worth spending
more budget chasing a cleaner one, and it applied to both time and
resource cost throughout this project, not just one or the other.

A lot of that speed came from the kind of code that's necessary but not
interesting to write by hand: the unit conversion tables covering sixteen
categories and ninety-plus units, the physical constants library, keypad
layouts with three meanings per key. That's thousands of lines that are
individually simple but tedious and error-prone to type out one by one,
exactly the kind of well-specified, repetitive work where an AI-assisted
pass is faster and more accurate than doing it manually, as long as someone
checks the actual values afterward.

That's not the only kind of speed worth mentioning, and it's not the more
impressive one. The genuinely hard pieces moved fast too: a marching cubes
implementation to turn implicit 3D surfaces into a renderable mesh, the
Karnaugh map minimization logic, the numeric root-finding methods. Those
aren't boilerplate, they're real algorithms with real edge cases, and
getting a correct first pass at any one of them by hand would normally eat
a day on its own. The speed there wasn't typing faster, it was compressing
the distance between knowing which algorithm I needed and having a working,
testable implementation of it, which still left the actual verifying to me.

A cursor that quietly jumped to the end of the line after every keystroke.
A delete key that erased the wrong character. A calculator that looked
tiny and lost in the middle of a wide screen. None of those showed up in
any architecture diagram.

---

## 8. Three Hard Problems

Fair warning before diving in: this section runs more technical than the
rest of the piece. If you want the shape of the story without the
implementation details, the short version is at the end of this section,
or skip ahead to Part 3 for the next topic entirely.

A cursor that jumps to the end of the line. A root-finder that quietly
fails on the wrong input. A surface that can't be plotted the way every
tutorial plots surfaces. None of these showed up on the architecture
diagram, and all three taught me something specific about what building a
real instrument actually demands.

### Problem one: a cursor that wouldn't stay put

MathLive, the library rendering the textbook math input, wants to own its
own cursor and selection state. The natural instinct coming from React is
to treat it like any other input: keep the expression in component state,
and whenever that state changes, push the new value back into the field.
That's the standard "controlled component" pattern, and it's usually the
right one.

It quietly broke every keystroke. Click into the middle of an expression,
type a character, and the cursor would jump to the end of the line before
the next character landed. The bug wasn't obvious from the code, `setValue`
looked idempotent, pushing the same content back in shouldn't do anything
visible. But MathLive resets the caret to the end on every `setValue` call
regardless of whether the content actually changed, so re-applying a value
that just came *from* the field was quietly sabotaging the exact thing it
was supposed to preserve.

The fix was to stop treating the field as controlled at all. MathLive keeps
its own source of truth; React just listens. Inserting a symbol from the
keypad or deleting a character now goes through MathLive's own cursor-aware
commands, `insert()` and `executeCommand('deleteBackward')`, instead of
string concatenation or slicing that has no idea where the cursor actually
is. The delete key had the same disease in a different form: it was
hard-coded to chop the last character off the whole string, so deleting
with the cursor in the middle of an expression would silently remove the
wrong character entirely.

![Cursor-aware editing — inserting and deleting mid-expression without jumping to end](../media/cursor-editing.gif)

### Problem two: one root-finder isn't enough

SOLVE needs to find where a user-typed function crosses zero. Newton-
Raphson is the obvious first choice, it converges fast, and the math is
genuinely simple: take a guess, use the function's derivative to estimate
a better one, repeat.

The catch is right there in the method: it needs a derivative, and it needs
that derivative to behave. If the guess lands somewhere the slope is zero
or close to it, the next step divides by something close to zero and the
guess goes flying off in a useless direction. A perfectly reasonable
function, a perfectly reasonable starting guess, and Newton-Raphson can
still fail outright.

So SOLVE isn't one method, it's three, with a fallback order. Secant
approximates the derivative from two nearby points instead of requiring an
exact one, which handles the cases where Newton's derivative estimate is
unstable, at the cost of needing two starting points instead of one. If
even that struggles, bisection is the fallback of last resort: give it two
points where the function has opposite signs, and it's mathematically
guaranteed to converge, just slower, because it only ever cuts the search
interval in half each step. Fast-but-fragile, slower-but-more-robust,
slowest-but-guaranteed, in that order, is a genuinely common pattern once
you're solving problems on arbitrary user input instead of on inputs you
got to choose yourself.

![SOLVE panel — Newton-Raphson iteration table converging on a root in 4 steps](../media/solve-panel.png)

### Problem three: the surface that isn't a function

Plotting `z = f(x, y)` is conceptually simple: for every `(x, y)` on a
grid, compute one `z`, and connect the resulting points into a mesh. It's
the 3D equivalent of plotting `y = f(x)` in 2D, just with an extra
dimension of sampling.

An implicit surface like `f(x, y, z) = 0` breaks that entirely, because
there's no "compute one output" step. A sphere is `x² + y² + z² - 1 = 0`,
and for most `(x, y, z)` triples, that expression is nonzero, it's only the
thin shell where it equals exactly zero that defines the surface. You
can't sample your way to that shell by picking two coordinates and solving
for the third; the third coordinate might have zero, one, or several valid
values, or none at all.

The actual technique, marching cubes, comes from volumetric imaging rather
than typical calculator territory. Divide 3D space into a grid of small
cubes, evaluate the implicit function at each of the eight corners of every
cube, and check which corners are positive and which are negative. Wherever
a cube has a sign change along an edge, the surface crosses that edge
somewhere, and you can interpolate exactly where. There are 256 possible
combinations of positive/negative corners per cube, each one maps to a
specific small patch of triangles, and stitching those patches together
across every cube in the grid produces the full mesh, which then gets
handed to Three.js to actually render in WebGL. It's a completely different
algorithm from explicit surface plotting, not a harder version of the same
one.

![Rotating a 3D implicit surface — torus rendered via marching cubes in WebGL](../media/3d-surface.gif)

What ties these three together isn't difficulty for its own sake. None of
them showed up as a risk on paper, a cursor bug looks trivial until you hit
it, a root-finder looks done once it works on the one example you tried,
an implicit surface looks like "just another graph" until you actually sit
down to plot one. Every one of them only became visible by actually running
the thing. None of it is specific to calculators, either, any system that
takes arbitrary structured input and has to keep behaving correctly across
every case of it, not just the ones you thought to try, fails in exactly
this shape: quietly, at the edges, in the place the spec didn't cover.

---

*That's Part 2. Part 3 covers how a calculator actually gets tested, what
it took to ship this like a real product instead of a demo, and why I built
this in the first place.*
