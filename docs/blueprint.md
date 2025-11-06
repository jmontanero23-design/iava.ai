

AI-Driven “Unicorn” Trading System – Research &
Design Blueprint
Saty ATR Levels & SATY Indicator Ecosystem
Saty ATR Levels: Developed by Saty Mahajan, this indicator plots adaptive support/resistance levels based
on ATR (Average True Range) and key Fibonacci ratios. It uses the previous period’s close as a central
pivot, then adds “trigger” levels at ±23.6% of ATR (potential long/short entry triggers), mid-range levels
at 61.8% of ATR,  full range at ±1 ATR, and extension levels at 161.8% (≈1.618 ATR) beyond the pivot.
In practice, if price moves above the upper 23.6%-ATR trigger, it signals a possible bullish breakout; falling
below the lower trigger signals a bearish move. The 1 ATR level often serves as a profit target or intraday
range expectation, while a  2×ATR extension  marks an extreme move. An info panel displays the
current trend (bullish/bearish) derived from EMAs and how much of the ATR range has been utilized (range
%), helping traders judge if a move has room to run or is stretched.
How levels are derived: The ATR Levels script computes these zones using the prior day’s closing price as a
baseline. For example, with ATR = X, it plots a lower trigger at prevClose – 0.236·ATR and an upper
trigger at prevClose + 0.236·ATR. Likewise, the full-range support is at prevClose – 1·ATR and
resistance at prevClose + 1·ATR. “Mid” levels near 0.618 ATR and extension levels (1.236, 1.618×ATR,
etc.) are also drawn. These create a “cloud” of shaded regions around the price – essentially ATR-
based support/resistance bands above and below the prior close. The default ATR lookback is 14 periods,
and multiple trading modes (day, swing, position, etc.) adjust the reference timeframe for ATR (e.g. day
mode uses daily ATR, swing might use weekly).  In essence, Saty’s ATR clouds map out expected
price range and key inflection levels for the current session. Traders often treat the 23.6% ATR lines as
entry triggers and the 100% ATR lines as primary targets. A move beyond 1 ATR into the extension zone
(1.618 ATR) is relatively rare and may indicate an extremely strong trend or exhaustion point.
Trend and signals: Saty ATR Levels incorporates a trend assessment (labeled in the info box) based on an
EMA ribbon – by default EMAs 8, 21, 34 are used to gauge trend direction. For example, if the fast
EMA (8) is above the slow EMA (34), the trend label shows bullish. This trend label was later refined using
Saty’s Pivot Ribbon logic. The indicator also labels potential long/short signals: when price crosses
above an ATR trigger level in an uptrend, a long setup is indicated; conversely breaking below the lower
trigger in a downtrend signals a short. These “Saty signals” are meant to be confirmed with other
factors like volume or price action. In Saty’s educational content, he emphasizes using ATR levels  in
confluence with trend and price patterns – e.g. a common play is a break-and-retest: price breaks a
trigger level, then retests it and holds, confirming an entry with ATR targets above. Traders also watch
for when price approaches a full ATR level; hitting ±1 ATR from the pivot might be a take-profit zone for day
trades, since that’s the expected daily range. A run to 2 ATR is a “home run” move – quite rare – and likely to
pull back unless a major catalyst is driving it.
SATY Cloud & Pivot Ribbon: In the trading community, “Saty cloud” often refers to the visual ribbon or
cloud around price created by the ATR bands (e.g. shading the area up to the trigger or ATR levels). Saty
1
1
1
2
34
56
1
57
8
1
9
9
1

also   introduced   the  Pivot   Ribbon  indicator,   a   multi-EMA   ribbon   system   “inspired   by   Ripster   EMA
Clouds”. The basic Saty Pivot Ribbon uses three EMAs (default 8, 21, 34) to define trend and support/
resistance zones. It color-codes the ribbon: green/blue for bullish trend and red/orange for bearish,
with a “ribbon folding” visualization when EMAs cross (the ribbon narrows at crossover). A   bullish EMA
crossover (e.g. 8 EMA crossing above 34 EMA) will turn the ribbon from red to green, providing a clear trend
flip signal. The Pivot Ribbon Pro version extends this to 5 EMAs (8, 13, 21, 48, 200) for more granular long-
term context. It even adds  “conviction arrows”  when medium-term EMAs (13 and 48) cross,
suggesting a high-conviction trend change. In our system, Saty’s ATR levels will supply structure (key
price levels, targets) and a basic trend bias, while the Pivot Ribbon (or an equivalent EMA filter) will ensure
we trade in the direction of the broader trend (e.g. only take longs if the ribbon is bullish/green, meaning
shorter EMAs above longer EMAs).
Using Saty’s indicators – rule cues: Based on Saty’s tutorials, a potential long setup might be: Price is
above the central pivot and ATR trigger, trend label is bullish, and volume confirms – enter long, target the
1×ATR level or next fib level. A   short setup: Price breaks below the lower ATR trigger in a downtrend
and stays below the pivot, signaling momentum to the downside. Saty often notes the previous day’s close
(pivot) as a make-or-break level – e.g. if price fails to reclaim the prior close after morning moves, and falls
into the lower ATR band, it favors shorts. Additionally, the ATR range % tells if there’s fuel left: e.g. if by mid-
day the stock has only used 50% of its ATR, there may be room for a further trending move; if it’s already at
120% of ATR (beyond full range), the move may be overextended. We will incorporate these insights by
treating Saty ATR bands as dynamic support/resistance and using them to place stops and targets (e.g.
stop just below a key ATR support for longs, target at the next ATR band up). In summary, Saty’s ecosystem
(ATR Levels + Pivot Ribbon) provides a structured price map and trend filter for our strategy.
Ripster EMA Clouds (Trend “Clouds” by EMAs)
Concept and Construction:EMA Clouds were popularized by trader @Ripster47 as a visual trend-following
system. An EMA Cloud is simply the area shaded between two chosen EMA lines, creating a “cloud” that
highlights trend direction and acts as dynamic support/resistance. For example, shading between the
34 EMA and 50 EMA yields a mid-term trend cloud – if price is above the 34/50 cloud and the cloud is
colored green (fast EMA > slow EMA), the bias is bullish; if below a red cloud (fast < slow), bias is bearish.
Ripster’s system employs multiple EMA clouds of different lengths simultaneously, akin to a “rainbow” on
the chart. Common sets include: 5-12 EMA (very fast cloud for short-term trend), 8-9 EMA (ultra-fast,
often used for minor pullbacks), 20-21 EMA (fast vs medium), 34-50 EMA (core trend filter), and sometimes
even 72-89 EMA for a long-term trend cloud. The  34/50 EMA cloud  is particularly significant –
Ripster calls it the “overall trend decider”: price above the 34-50 cloud = bullish regime, price below =
bearish, on any timeframe. In practice, traders keep an eye on the color flips of the clouds (e.g.
when a cloud turns from red to green, indicating an EMA bull cross) as potential trend change signals. 
“Ideally, a 5-12 or 5-13 EMA cloud acts as a fluid trendline for day trades, 8-9 EMA clouds can be used as pullback
levels, and a price over the 34-50 EMA cloud confirms a bullish bias on any timeframe,” as Ripster explains.
Usage for Entries & Exits: EMA clouds provide clear visual zones for entries, stops, and exits. For instance,
in an uptrend, price will often pull back “into the cloud” (between the two EMAs) and then bounce – this
is a low-risk entry point to “buy the dip” with the cloud serving as support. Traders will enter when
the pullback holds at or above the lower EMA and the cloud stays green, then ride the next leg up. The
cloud bottom or top can serve as a stop level – e.g. if price closes fully below the cloud (in a long trade), it
often signals trend failure. Figure 1 illustrates this concept: a green 20/50 EMA cloud acting as support –
10
11
12
1314
14
115
216
17
18
19
2021
1822
23
24
2526
2

when price dips into the cloud, it finds support and resumes rising, whereas a red 34/50 cloud above price
acts as resistance in a downtrend.
Fig.1: Example of Saty ATR Levels on a daily chart. Shaded “cloud” regions mark key ATR-based support/resistance:
the yellow band is the prior close (pivot), turquoise lines are ±1 ATR, and gray lines are fib extensions (1.618 ATR).
The info box (top-right) shows trend direction and current range % of ATR. Traders look for price to break
above or below trigger levels (white lines just outside the pivot) to initiate trades, with targets at the ATR bands.
In Ripster’s system, multiple clouds work together: For example, a trader might use 34/50 EMA cloud to
determine the overall trend (must be green for longs), then use a faster 8/21 EMA cloud (or 5/12) for timing
entries – entering on a smaller pullback that touches the 8/21 cloud and then resumes upward. The 8-9
EMA cloud (virtually a ribbon since 8 and 9 are close) is sometimes overlaid to mark very shallow pullbacks
or momentum continuation points. Ripster notes that these smaller EMA clouds are “optional” – they
can help identify add-on entry points during a strong trend (e.g. adding to a position when price pulls back
to the 8 EMA). However, the bigger picture is governed by the 34/50 cloud: if price is over the 34 & 50 EMAs
(bullish cloud) stay long-biased; if under a red 34/50 cloud, favor shorts. This rule is often called
Ripster’s “Golden Rule of Trend”, echoing the Ichimoku concept: never trade against the higher-timeframe
cloud. Our strategy will adopt this by requiring, for instance, that longs are only taken when price is above
the anchor cloud (34/50 or similar) and that cloud is bullish (e.g. 34 EMA > 50 EMA).
Example – Day Trading with EMA Clouds: Suppose we’re watching a stock on a 10-minute chart (Ripster’s
recommended intraday timeframe). Off the open, price surges above the  34/50 cloud  which turns
green – giving us a bullish bias. We then wait for the first pullback to the 5/13 cloud (very tight) or the 8/21
EMA cloud. Price pulls back and touches the 8 EMA (within the cloud area) while volume remains strong;
the 34/50 cloud is still green and below price. This confluence (short-term dip in a larger uptrend) is our
entry cue. We go long as price ticks back up off the cloud. The stop can be set just below the 21 EMA or
below the 34 EMA – essentially below the cloud support. As price resumes the uptrend, we take partial
profits when it reaches the prior high and monitor the cloud color: if a red cloud forms (say 5 EMA crossing
under 13 EMA) we might tighten our stop or take profit, as that could signal a momentum cooldown. If
instead the clouds remain bullish stacked and price continues, we ride the trend. Color flips of clouds are
key exit signals – e.g. a green-to-red flip on the fast cloud or ultimately on the 34/50 cloud means the
trend likely reversed. This systematic approach helps avoid emotional exits; you “stop out” when the trend
structure (cloud) fails, not just on random noise.
Typical parameters and confluence: Many traders have personalized which EMA pairs to use. Ripster’s
own posts suggest 5-12 or 5-13 for a “fluid” intraday trendline,  8-9 for detecting minor dips, and 34-50 for
the dominant trend on both intraday and swing timeframes. Others also use  20-21  or     72-89  for
additional context. The idea is to layer multiple clouds to see short, medium, and long-term trends at a
glance. In our system, we might incorporate two sets: an  “entry cloud”  (fast EMAs, e.g. 8 & 21) and a
“context cloud” (slow EMAs, e.g. 34 & 50). A rare alignment occurs when all these clouds agree (both fast
and slow clouds bullish, for instance). Such multi-timeframe confluence is powerful – e.g. a stock above a
bullish 34/50 cloud on the 1-hour chart and also above a bullish 8/21 cloud on the 15-min chart is a high-
confidence long setup. We’ll leverage these ideas in our “unicorn” detector, giving extra weight to signals
when different trend measures line up together. As one source notes, the EMA cloud indicator essentially
combines the logic of moving averages and Ichimoku – it shades the space between averages, making
trend “regimes” obvious and encouraging traders to buy dips in green clouds and sell rallies into red clouds
. 
2627
1
24
28
2921
30
24
20
3129
3

TTM Squeeze & Momentum Breakouts
TTM Squeeze Overview:  The TTM Squeeze (by John Carter) is a popular indicator for identifying  low-
volatility periods that precede explosive moves. It works by combining Bollinger Bands and Keltner
Channels  to find when price volatility contracts. Specifically, when the  Bollinger Bands (typically 20-
period, 2σ) tighten enough to fit inside the 20-period Keltner Channels (1.5×ATR width), the market is
in a    “squeeze” – a very quiet, compressed state. The TTM Squeeze indicator plots this as a series of
dots on the zero line: red dots indicate “Squeeze ON” (BB inside KC; volatility is compressed) and green
dots indicate “Squeeze OFF” (BB has expanded back outside KC; volatility release). The core idea is
“periods of low volatility often precede large directional moves” – so a red dot sequence is like a coiled spring,
and the first green dot is the spring releasing. The indicator couples this volatility signal with a momentum
oscillator (histogram)  to gauge the likely direction of the breakout. The momentum histogram
usually oscillates above/below zero and may be colored (e.g. light vs dark bars) to show increasing or
decreasing momentum. When a squeeze “fires” (green dot), Carter’s rule of thumb is to trade in the
direction of the momentum histogram at that moment. For example, if the squeeze fires and
the momentum bars are well above zero (indicating buying pressure), you’d go long, anticipating an upward
breakout. Conversely, if momentum is below zero on the release, favor a short trade.
Parameters and variants: The standard settings are BB(20, 2.0) and Keltner(20, 1.5 ATR) as mentioned
. These can be tweaked (some traders use 1.0 ATR or 2.0 ATR Keltner, or different periods, for different
instruments/timeframes). There are also proprietary variants like “Squeeze Pro” that identify different
grades of squeezes (e.g. shallow vs deep compression), but the principle remains: identifying price range
consolidation. The momentum component in TTM Squeeze is essentially a smoothed momentum oscillator
often calculated via a linear regression of price vs a local average – but one need not dive into the
math. Visually, rising green histogram bars mean upward momentum increasing, red bars mean downward
momentum. We will likely use a simplified momentum measure (even something like MACD or RSI could
serve if needed) in tandem with the squeeze dots.
Trading the Squeeze – Best Practices: A common strategy is to wait for at least one green dot (“squeeze
off”) as confirmation before entering, rather than predicting the breakout during the red-dot phase.
Carter often entered on the first or second green dot following a series of red dots. Additionally, the
length of time in a squeeze matters: a squeeze that lasted many bars signifies a stronger base and often
a bigger ensuing move, whereas a very brief squeeze (just 1-2 red dots) might be a false start. In fact, many
traders  filter out “weak” squeezes  by requiring a minimum number of red dots before acting. For
example, one quantitative analysis found that waiting for 3 consecutive squeeze bars (red dots) before
trading improved the outcome – it filtered out quick volatility flashes that didn’t lead to real trends. We
will incorporate this by, say, only considering a squeeze signal valid if the squeeze condition held for a
certain number of periods (e.g. >2 bars). This reduces whipsaws.
Another best practice is  to confirm the squeeze breakout with external factors. Because a volatility
breakout can fail (price might pop then reverse), it’s wise to  trade squeezes in the direction of the
prevailing higher-timeframe trend or with a confirming chart pattern. For instance, if a daily
chart is in a strong uptrend and a 1-hour chart goes into a squeeze, you’d favor an upside resolution.
Volume is also a helpful confirm: a squeeze releasing on high volume is more likely real. One guide suggests
“avoid squeezes that fire without any support from volume or structure – they may be false moves”. We can
add a rule that the breakout bar should have above-average volume or break a key technical level (like a
recent swing high/low) to take the trade.
3233
34
3536
3536
33
37
3839
40
41
41
4243
44
4

Momentum   confirmation:  When   the   squeeze   fires,  check   the   momentum   histogram  –     increasing
momentum in the breakout direction greatly increases success rates. A recommended rule is to enter
on the first green dot *only if the momentum histogram has already turned favorably for at least 1-2
bars. For example, during the red-dot squeeze on a stock, suppose the momentum bars were below zero
(indicating slight down pressure), but a couple bars before the squeeze fired, the histogram ticked upward
above zero – that bullish shift gives confidence to go long on the release. If momentum stays negative or
unclear, one might wait despite the green dot. A study by Simpler Trading found that “entering 1.5 bars after
the squeeze release improved results” – essentially meaning don’t rush in at the exact first dot if momentum
isn’t clear; give it a bar or two.
Exits in a squeeze trade: A typical target is to play for a 2-3 bar explosive move then take profits or trail
stop. John Carter often exits when the momentum histogram peaks (starts to tick the other way) or when a
certain multiple of ATR is reached post-breakout. We could, for example, tie our profit-taking to the ATR
levels: if a squeeze breakout coincides with, say, price reaching the next Saty ATR band (like going from the
pivot to the 1ATR level), that could be a logical partial take-profit. For stop placement, a common choice is
the    opposite side of the consolidation range or a fraction of ATR. Since volatility was low, ranges were
tight: one might place a stop just inside the squeeze range. Another systematic approach is Carter’s
suggestion: if no significant move happens within a set time (e.g. 5 bars after squeeze fires) or if price
reverses into the squeeze range, then the trade failed – exit early.
In summary, TTM Squeeze will be a key volatility trigger in our system. We’ll scan for moments when
multiple signals align  right as a squeeze is releasing. The ideal scenario:  a rare alignment (multiple
indicators in agreement) coinciding with a squeeze firing – this often leads to the biggest “unicorn” trades
because the market had coiled up and then all our signals pointed one way as it springs loose. By insisting
on momentum and trend confirmation (e.g. squeeze fires and our trend indicators are bullish), we aim to
filter out head-fakes. Historical tests show that adding such filters dramatically improves win rates.
Ichimoku Cloud – Trend, Confirmation & “Equilibrium Pullbacks”
Background: The Ichimoku Kinko Hyo (IKH) system is a comprehensive trading framework that provides a
“one look equilibrium chart” – meaning with one glance, a trader can assess the trend, momentum, and
support/resistance. It consists of five main components: the Tenkan-sen (Conversion Line),  Kijun-sen
(Base Line),  Senkou Span A & B (Cloud boundaries), and Chikou Span (Lagging Line). The Cloud
(Kumo) is the most striking feature – it’s the area between Span A and Span B, projected 26 periods ahead.
The cloud’s color (typically green when Span A > Span B, or red when A < B) and thickness convey trend
direction and strength of support/resistance.  Price above a green cloud = bullish trend bias; price
below a red cloud = bearish bias. A thick cloud means a strong prior range (robust S/R), while a thin cloud
indicates weak support that price can slice through more easily.
Tenkan & Kijun: These are essentially moving-average-like lines (though calculated as midpoints of highs/
lows). Tenkan (period 9 by default) is the faster line and Kijun (period 26) is slower. Their crossovers are akin
to MA crosses and are called TK crosses. A   bullish TK cross (Tenkan rising above Kijun) is a buy signal, with
its strength qualified by where it happens relative to the cloud: above the cloud is a “strong” bullish signal, 
within the cloud is moderate, and below the cloud (in bearish territory) is a weak or contrarian signal.
The logic is that a bull cross occurring when the overall trend is already bullish (price above cloud) is much
more reliable than one against the prevailing trend. Our system will heed this by, for example, only acting
36
45
4144
46
4748
4950
5152
53
5

on bullish TK crosses when the broader trend (cloud) is also bullish – otherwise we treat it with caution.
Similarly, a bearish TK cross (Tenkan below Kijun) is strongest if it occurs below a bearish cloud.
Chikou Span: This is the current price plotted 26 periods back. It serves as a confirmation filter – it shows
how current price compares to prior price action. In Ichimoku rules, a trade is well-supported if the Chikou
is  “free and clear” in the intended direction. For instance, in a bullish setup, you want the Chikou
line to be above the past 26-period price candles and above the past cloud – meaning nothing but “open air”
to the left, so there’s no immediate historical resistance. If Chikou instead is bumping into previous highs
or the cloud, it warns that current price may be hitting resistance when looking 26 periods back (which
often corresponds to significant levels). So a rule of thumb:  only take a breakout if Chikou has also
broken above the equivalent past level. In our usage, we’ll check that the Chikou is not stuck below
an old support or resistance. If we get a unicorn long signal but Chikou is, say, below the prior month’s high,
we might anticipate turbulence as it coincides with that barrier.
Cloud   as   Support/Resistance   &   Equilibrium:  The  Ichimoku   cloud   essentially   projects   support/
resistance forward. Price will often pause or rebound at the cloud edges (Span A or B). A common
Ichimoku strategy is the Kumo breakout: when price decisively closes above the entire cloud, it’s a major
bullish signal (especially if the forward cloud flips green), and vice versa for breakdown. However, false
breakouts are common if the cloud is thick and flat, or if Chikou immediately hits an obstacle. So
the system teaches to either  wait for a pullback to the broken cloud for confirmation  or ensure multiple
conditions align (forward cloud turn, Chikou clear, etc.). We will adopt a cautious approach: even if our
other indicators flash long but price is still inside a large Ichimoku cloud, we may delay entry until price
clears that cloud (since inside the cloud implies range-bound uncertainty). On the other hand, if the cloud is
very thin (small equilibrium zone) and our signals trigger, the breakout could be swift.
Perhaps the most useful concept from Ichimoku for us is the idea of “equilibrium pulls”. In a trending
market, price tends to move in waves, extending from equilibrium and then snapping back. The Kijun-sen
(26-period base line) represents a medium-term equilibrium – price often returns to it during corrections
. A strategy described by Ichimoku experts is: if trend is bullish (price above cloud), wait for a pullback
below Kijun (signaling a dip), then buy when price recovers back above Tenkan (conversion line) to resume the
uptrend. This achieves a better entry (buying the dip toward equilibrium) with the cloud defining the
context (bullish bias maintained). For example, ChartSchool outlines a 3-step Ichimoku buy criteria: (1)
price above the cloud (bullish bias), (2) price dips below Kijun (base line) to test support, (3) then price
crosses back above Tenkan (conversion line) to signal end of pullback – that’s the buy trigger. Stops
can be placed just below the recent pullback low or on a breach of the cloud. This approach aligns well with
our multi-indicator system: we can use Ichimoku to validate that taking a counter-trend pullback entry isn’t
premature. For instance, if our other indicators say “buy” but Ichimoku shows price still under the Kijun and
not yet turning up, we might wait – often the safest entry comes after price reclaims the Kijun or Tenkan. In
downtrends, the mirror applies (sell on a relief rally that fails at Tenkan).
Integrating Ichimoku:  We will use the  Ichimoku cloud mainly as a higher-level trend filter and
support/resistance map. Concretely: Do not initiate longs if price is below the cloud or the cloud ahead is red
and thick. If price is inside the cloud, recognize it’s a choppy zone – perhaps require extra confirmation or
smaller size. Ideally, our unicorn long signals will coincide with price above the cloud (or emerging from it)
with a fresh bullish TK cross and Chikou confirmation. That scenario – often called an “Ichimoku breakout” –
is known for high probability. Also, once in a trade, we can use  Ichimoku levels for trade
management: e.g. Kijun-sen as a trailing stop (it’s common to trail a stop a bit beyond Kijun, since a
5455
56
57
58
59
59
52
60
6162
6162
5356
6

breach of Kijun often signals a deeper correction). For taking profit, flat Span B levels (flat lines in the
cloud) often act like magnets and targets – e.g. if a bullish move starts, it often runs to the next flat
cloud level. We can mark those as potential exit zones.
In summary, Ichimoku gives us a redundant, yet robust check on trend direction and “health” of price
action. By requiring that our trades align with Ichimoku signals (or at least are not fighting them), we
increase our odds. For instance, a “rare alignment” signal where SATY, Ripster, and Ichimoku all agree –
e.g. price is above Saty’s pivot and ATR trigger, in a green Ripster cloud, and also above the Ichimoku cloud
with a bullish TK cross – would be a dream scenario indicating a powerful uptrend across different
methodologies. Those are precisely the “unicorn” signals we aim to capture.
“Rare Alignment” and Ensemble Signal Detection (The “Unicorn”
Detector)
Concept of Confluence: In trading,  confluence means multiple independent signals pointing to the
same conclusion. Our goal is to detect those rare moments when several uncorrelated indicators all line
up bullish or bearish – which we dub “unicorn” signals due to their rarity. Research and trading wisdom
both suggest that trades based on multiple converging factors have higher probability of success.
Especially if each factor covers a different aspect (e.g. one measures trend, another momentum, another
volatility, etc.), the chance of all agreeing by random coincidence is low – so when it happens, it’s a
“suspicious coincidence” likely indicating a significant opportunity. The key is that the indicators should be as
independent as possible (no redundant overlap, also known as avoiding multicollinearity). For example,
getting a buy signal from both RSI and Stochastic isn’t as powerful (they’re both oscillators, likely correlated)
as, say, getting a buy signal from a trend indicator (EMA Cloud) and a volatility indicator (Squeeze) and a
structural level (ATR band). We specifically chose SATY ATR Levels, Ripster Clouds, TTM Squeeze, and
Ichimoku because they each assess different dimensions of market behavior – price structure, trend
momentum, volatility compression, and multi-timeframe equilibrium.
Measuring  Rarity:  To  systematically  identify  these  rare  alignments,  we  can  borrow  a  concept  from
information theory: Pointwise Mutual Information (PMI). PMI quantifies how unlikely a joint occurrence
of events is, compared to them occurring independently. In our context, an “event” might be “SATY ATR
gives a long signal”  or     “Ripster cloud is bullish”. If those two events are statistically independent, the
probability they coincide is P(A)×P(B). If in historical data they coincide much less often than that (meaning
usually they don’t happen together), then whenever they do coincide, PMI is high (positive) – indicating a
meaningful alignment beyond chance. We don’t need to calculate PMI precisely in real-time, but the
concept   guides   us:   find   indicator   pair/triad   combinations   that   rarely   overlap.   For   instance,   perhaps
historically the SATY long trigger and a bearish Ichimoku cloud are seldom both “on” – they usually conflict.
So if we ever saw SATY long trigger  while  Ichimoku is bearish, that might be a false signal (negative
confluence). Conversely, if SATY long trigger and Ripster bull cloud fairly often overlap (both being trend-
based), that alignment might be less “special” on its own. But adding a third factor like “squeeze just fired” –
which is independent of trend – could make the triple overlap extremely rare and thus potent.
Scoring and Threshold: We will design a Unicorn Score = Rarity × Quality × Regime-fit. Here: 
Rarity could be scored by an approximation of PMI or simply an empirical frequency. E.g., out of the
last N bars, how many had condition A and B and C all true vs how many you’d expect if A, B, C
63
64
65
66
66
• 
7

were random? We might compute a z-score or percentile. A high rarity means “this hardly ever
happens.”
Quality (Expectancy) means we weight the alignment by its historical outcome. If whenever A, B, C
aligned in the past, the forward 10-bar return was on average +2%, that’s a positive expectancy. If
some rare alignment led to mixed outcomes, its quality is lower. We can backtest each combination
to get an average payoff or win rate. This helps avoid chasing coincidences that aren’t actually
profitable.
Regime  weight  acknowledges  that  certain  strategies  only  work  in  certain  market  regimes.  For
example, a momentum-heavy confluence might work great in trending markets but fail in sideways
markets. We can pre-classify regimes (perhaps using something like ADX or volatility filters or simply
Ichimoku   cloud   slope).   Then,   if   our   current   regime   is   “trending,”   we   up-weight   signals   that
historically performed well in trending phases, and down-weight those that are meant for breakouts
if we’re in a dead range.
The    Unicorn Score is essentially an internal metric that the AI agent will calculate/approximate. When the
score exceeds a chosen threshold T, we will trigger the system to act (place a trade or send an alert). We’ll
determine T through historical optimization – likely picking a value that maximizes our return vs risk in
backtesting (for instance, the score above which trades had a Sharpe ratio above X, etc.). Initially, we expect
T to be high because we truly want only the cream of the crop signals – maybe only a few per month per
instrument.
Literature and analogs: This idea mirrors what some trading software call “Super Signals” – signals that
require multiple indicator consensus. For example, one system defines Bronze/Silver/Gold/Platinum signals
based on 2, 3, or 4 indicators aligning; the Platinum (all four align) signals are extremely rare but have
the highest win rate. They noted that when all their indicators triggered an identical entry
simultaneously, there was an  “exponentially low chance”  of it failing – effectively the move was almost
certainly significant. That’s the sort of edge we seek. Another perspective comes from ensemble
learning in AI: multiple models agreeing increases confidence if they’re independent. Here our “models” are
technical studies.
Avoiding   false   alignment:  We   must   be   wary   of   “pseudo-confluence”   where   signals   are   not   truly
independent. For instance, Ichimoku cloud bullish and Ripster 34/50 bullish will often happen together
(since they both reflect trend) – that’s valuable but not sufficiently independent. True unicorns might require
something like:  trend  +    volatility breakout  +    support level. Our score will prioritize combos of different
categories (Trend-following, Oscillator/Momentum, Volatility, Volume/Flow, Structure). By design, we have: -
Trend Structure: SATY levels (incorporates ATR structure and minor trend) and Ichimoku (major trend). -
Momentum:   TTM   Squeeze’s   momentum   or   an   MACD   histogram.   -  Volatility:   Squeeze   on/off,   ATR
expansion. -  Trend-following/MA: Ripster EMA clouds, Pivot Ribbon. -  Volume: (We haven’t explicitly
included volume indicators in the plan, but we could incorporate volume surge as an additional check for
unicorns).
An example “unicorn” long signal in our system might be: SATY ATR Levels trigger a long (price broke above a
key ATR level) AND Ripster EMA clouds all flipped green (bullish trend confirmation) AND a TTM Squeeze just fired
with upward momentum AND Ichimoku’s cloud is bullish with a fresh TK cross. This happening all at once is a
powerful alignment of breakouts and trend – a trade one would take with confidence and perhaps leverage
• 
• 
6768
68
8

higher (or at least risk a full 1% vs 0.5%). On the flip side, if only one or two conditions fire, we might either
pass or just send an FYI alert.
Regime filters: Our strategy will also incorporate regime context to avoid fighting the market’s character.
For instance, in a very choppy market, we might enforce a higher Unicorn Score threshold or ignore certain
alignments (e.g. momentum breakouts might fail repeatedly in mean-reversion regimes). If our AI agent
detects that market volatility regime is low (ATR is minimal, no clear trends), it might require an extra
confirmation (like a higher timeframe agreement) before acting. Conversely, in a trending regime, we
loosen criteria slightly on trend-following signals (since almost any dip in a strong trend can be bought,
multiple signals or not). This dynamic weighting improves the practicality of the unicorn detector.
Finally, we’ll maintain a log of all candidate signals and their outcomes. Over time, the data will tell us
which combinations of indicator states truly yield the best results (we might discover, say, that a certain
trifecta of conditions has a 70% win rate for 2R gains – that combination’s score should be high). Our system
can then learn and adjust the Score formula or threshold accordingly. The result will be a sort of  self-
optimizing ensemble system, grounded in solid trading principles and confirmed by real data.
Core Strategy Design Elements
Combining the research insights above, we outline the  core strategy  that our AI trading assistant will
execute:
A. Feature Vector (Per-Bar Data Points): To make decisions, our agent will compute a rich set of features
each bar (or on each TradingView alert). These include:
Trend/Structure Features:
Ichimoku State: Is price above or below the cloud? Cloud color (bullish/bearish)? Distance from cloud
(e.g. % above Span B)? This tells us trend bias and potential support/resistance ahead.
Saty ATR Levels: Nearest ATR support and resistance levels relative to price (e.g. price is 0.4 ATR above
the pivot, approaching the 1ATR target). Also, whether price has broken an ATR trigger or not.
Pivot Ribbon / EMA Cloud: Current state of Ripster EMA clouds (color of fast cloud, color of slow cloud).
For example, “8/21 cloud green” and “34/50 cloud green” – a strong uptrend, or if mixed (fast cloud
flipped down but slow still up) – a potential pullback.
VWAP Distance: Price vs VWAP (volume-weighted avg price) especially intraday – extended far above
VWAP might caution chasing a long without pullback, etc.
Momentum Features:
TTM Squeeze Momentum: The value of the squeeze histogram (or a proxy like MACD) and whether it’s
increasing or decreasing. 
Oscillators: We might include RSI or Stochastic values to gauge if something is overbought/oversold
in context (though these are secondary since our main signals cover momentum in other ways).
Volatility Features:
• 
• 
• 
• 
• 
• 
• 
• 
• 
9

Squeeze Status: A flag if a TTM Squeeze is on (squeeze in progress), just fired this bar, or off. Possibly
how many bars it’s been in a squeeze. 
ATR & Range: Current ATR value, today’s range vs ATR (e.g. % of daily ATR used so far) – this tells if a
move might stall (if range already expended) or has room.
Volatility Regime: A slow ATR or HV (historical vol) measure to classify the environment as high vol or
low vol regime.
Pattern/Structure:
Recent Highs/Lows: e.g. distance to recent swing high/low or prior day high/low. (Is the signal
occurring at a breakout of a range or in the middle?)
Level Touches: Flags if price is currently touching an important level: e.g. a Saty level (pivot or ATR
band), an Ichimoku cloud boundary, or a prior session high. These often trigger algorithms or
supply/demand.
Other Context:
Session/Time: What market session (e.g. pre-market, opening hour, lunch, power hour) – since some
signals are better at certain times (opening breakouts vs midday mean reversion). Our plan is to
focus on primary session signals and possibly avoid lunchtime lulls or post-market.
News/Events: (Difficult to quantify automatically, but we might incorporate a feed or at least a
calendar of major events to avoid trading right into, say, Fed announcements. For now this could be
manual – a “halt trading” toggle around scheduled big events.)
This feature vector will feed into our AI agent’s decision logic. Rather than using a black-box ML model,
we’ll encode rules and thresholds informed by these features (the agent will operate more like an expert
system with these as inputs).
B. “Unicorn” Detector Engine: As described, the agent will compute a Unicorn Score for each bar or alert.
Internally, we define certain indicator alignment events, for example: - Bullish_SATY = true/false
(e.g. price > upper trigger, trend label bullish), - Bullish_RipCloud = true/false (fast & slow EMA
clouds both green), - Squeeze_Fired_Up = true/false (squeeze just released with momentum > 0), -
Bullish_Ichimoku = true/false (price above cloud and TK cross up, or at least no contradiction from
Ichimoku).
We then look at combinations like (Bullish_SATY AND Bullish_RipCloud AND Squeeze_Fired_Up)
and measure how rare that is. The agent can have a dictionary of historical frequencies (from a backtest
dataset or running counters in real-time). Likewise combinations for short side. When a combination
triggers, it assigns a base rarity score (e.g. 5 if very rare, 1 if common). It then multiplies by a factor for
quality – e.g. maybe we have stored that this combo historically yields +0.8% in 5 bars on average, which we
normalize into a quality factor. And then multiplies by a factor for regime fit – e.g. if today’s ADX or trend
regime is favorable for that combo (say the combo is a trending signal and ADX is high), we give it full
weight; if regime is opposite, we dampen it.
The agent will likely simplify this process by using a set of rules-of-thumb initially: - If 4/4 major conditions
align (trend, momentum, volatility, structure) -> Score = High (e.g. 100). - If 3/4 align -> Score = Medium-
• 
• 
• 
• 
• 
• 
• 
• 
• 
10

High (e.g. 70). - If it’s a conflicting picture (2 align, 2 opposite) -> Score very low or negative. - Certain specific
triple alignments might be manually recognized as well (“pattern recognition”). For example, a note from
our   research:  A   squeeze   firing   within   an   established   trend   often   yields   a   big   move.   So   if
Squeeze_Fired_Up AND Bullish_RipCloud AND price near a SATY support (implying a with-
trend breakout from consolidation off support) – that might be scored highly even if Ichimoku’s not fully in
agreement yet.
We will calibrate the threshold T through testing. Initially, T might be, say, 80 on a 0-100 scale if we only
want trades when at least 3 factors align strongly. When a Score ≥ T, the agent issues a  trade action
(“unicorn alert: go long/short”). If Score is say 50-79, maybe it’s a  softer signal  – we could send a
notification (“conditions look good but not all lined up”) without auto-trading, allowing the human to
monitor. Score < 50 means no action.
C. Trade Rules & Execution Logic:
Once a valid entry signal is identified (Score threshold met and no disqualifying risk conditions), the system
will execute a trade entry with predefined exits and sizing. Here are the first-pass trade rules we will use:
Long Entry Criteria:
At least two independent bullish signals coincide, including one trend-based and one momentum/
volatility-based. For example: SATY ATR trigger is hit and Ripster clouds flip bullish, or Ichimoku gives
a bullish TK cross and a Squeeze fires upward. Ideally, all of the above align for a unicorn score. 
The Unicorn Score ≥ T for longs. (This implicitly ensures things like price above key moving
averages, momentum rising, etc., as those contribute to the score.)
No major higher-timeframe resistance immediately overhead that would invalidate the signal (e.g. if
the long signal triggers just below a long-term cloud or yesterday’s high, we might wait for that to
break).
Ichimoku should not be signaling a clear opposite (we avoid longs if Ichimoku bias is strongly
bearish). At minimum, price should be above or in the cloud – not plunging below it.
If these are met, action = BUY. The agent will log an entry with current price as reference.
Short Entry Criteria: Similarly, require multiple bearish alignments. E.g. price breaks below a Saty
ATR support, Ripster 34/50 cloud is red (bearish), and a squeeze fires short with momentum below
zero. Ichimoku bias should be bearish (price under cloud). If Score ≥ T for shorts, action =
SELL (short).
Position Sizing: We use fixed fractional position sizing based on stop distance. The user’s config
specifies a risk per trade (e.g. 0.5% of account equity). The agent will calculate quantity = (risk% ×
equity) / (|Entry – Stop|). For example, with $100k equity and 0.5% risk ($500), if the stop is $2
away, it will trade 250 shares. It will also ensure this doesn’t violate a max position cap or exposure
limits. (We will also enforce max concurrent risk: e.g. if multiple trades open, their combined at-risk
amount if all stopped out shouldn’t exceed ~1.5-2% of equity as per config.)
Stop Loss (SL):  By default, we set an  ATR-based stop  beyond a logical support/resistance. A
common choice is around 1.5 × ATR from entry. For instance, if ATR(14) of the instrument is $1.00
and we enter long at $50, a default SL = $50 – 1.51.00 = $48.50. However, we refine this with structure: if
69
• 
• 
• 
• 
• 
• 
2470
• 
• 
71
11

there is a SATY level or Kijun line or cloud edge just below our entry, we might tuck the stop a bit below that
level for extra safety (i.e. beyond the “noise” around that support). We don’t want a stop just above a
known support where it can easily wick – better to be slightly below it. For longs, ideal stop is just below an
ATR support band or just under the last swing low that prompted our entry. For shorts, just above a recent
swing high or ATR resistance. Example: If we went long on a unicorn signal and one of the reasons was
that price bounced off the Saty pivot (previous close), we could place the stop just below that pivot. If using
ATR only, we’ll ensure if there’s a nearby ATR level we align with it. This approach combines ATR volatility
buffering with price structure* for robust stops.
We will set a default SL in the alert payload (the Pine script already computes an initial stop based on 1.5
ATR) and allow the agent to adjust it if needed. By having the Pine script suggest sl  and tp , we ensure
speed, but the agent will double-check context. For example, if Pine suggests SL = $48.50 but an Ichimoku
cloud base is at $48.70, the agent might widen the stop to $48.30 to be just below the cloud. All these
adjustments will be done within reason and the structure rules encoded.
Take Profit (TP): We plan for tiered profit-taking. The initial target is typically set at 2 * risk (2R) by
default – meaning if our stop is 1.5 ATR, the TP is about 3 ATR from entry (for ~2:1 reward:risk).
For example, entry $50, stop $48.50 (risk $1.50), initial TP $53.00 (gain $3) for 2R. The Pine script
calculates this as tp = entry + 2 * (entry – SL) for longs. We will use that as full target if
we intend a single exit. However, best practice: scale out partial profits at interim levels. We might
realize partial profit at +1R or +1.5R, then trail the rest. Specifically: 
Take off, say, 50% of position at +1R (this covers the risk, effectively making worst-case a
breakeven trade if the rest stops out).
Take another 25% at +2R or at a key technical level (like Saty’s 1ATR band or a measured
move).
Let the final 25% run with a trailing stop.
The trailing stop could be managed by moving it to breakeven after 1R, then perhaps trailing below Kijun or
a short-term EMA as the price goes in our favor. For instance, after a move of +1.5R, we might trail the stop
to just below the 21 EMA on the timeframe, or below each new higher low. We will likely implement the
trailing logic in our agent’s notes or simply manually, since full automation of trailing in the agent might be
complex. But at minimum, after hitting first target, the agent can update the sl  in the JSON output to
breakeven or better.
If the Pine script provides a specific tp  (maybe based on a pivot or ATR extension), the agent can use it or
adjust if it sees a reason (e.g. if 2R falls just below a known resistance, maybe push TP slightly lower to
ensure fill, or if everything is extremely bullish, we might choose to not hard TP at 2R but rather trail
aggressively).
Trade Management Rules:
No Chasing: If a signal triggers but price has already moved significantly (say >0.5 ATR) in the
intended direction from the trigger level by the time we get the alert, the agent may choose 
action = notify rather than immediate order – telling us “signal occurred, but price ran too fast
to chase.” We can then wait for a pullback.
Time Stops: If after entry, the trade isn’t progressing (e.g. bars later still around entry), and perhaps
a squeeze failed, we might exit early. The agent will include a configurable timeout or observation
period (this might be implemented manually at first).
• 
72
72
◦ 
◦ 
◦ 
• 
• 
• 
12

Risk Mitigation: If a    daily loss limit or   drawdown limit is hit, the agent will halt further entries (it
can output action = pass with a note like “daily loss limit reached” for any incoming signals). For
example, if the account is down >2% on the day, it stops trading as per our risk policy.
Example Long Trade Flow:  Let’s cement with an example. Suppose SPY is in an uptrend (above
Ichimoku cloud, Ripster clouds bullish). It consolidates midday (TTM squeeze prints red dots). Our
algorithm detects: SATY ATR levels show price holding above the central pivot, Ripster cloud still
green, and now a green dot appears on TTM Squeeze with momentum crossing above zero – the
squeeze fired long. Ichimoku Tenkan also just crossed above Kijun as price bounces. Unicorn Score
shoots up, meeting criteria. The agent triggers a BUY. Entry price ~ say $400. It sets Stop at $397
(just below an ATR support at $397.2 and ~1.5 ATR away) and TP1 at $403 (approx 2R or near the next
ATR band). After entry, price goes to $401 – +1R move. The agent (or our plan) secures partial profit:
maybe sell 50% at $401, and move stop on remainder to $400 (entry). Price then continues to $403 –
we take another 25% off. We notice Ichimoku Chikou approaching prior highs (potential resistance)
and momentum waning. Perhaps we decide to exit the rest at $404 or trail aggressively under the 5-
min 8 EMA. That’s the ideal scenario of executing a plan with predefined levels. The agent will
automate as much as possible (initial bracket orders for SL/TP), and the finer trailing/partials logic
we can automate via multiple alerts or the n8n flow (or simply monitor manually with the knowledge
of the plan).
The    short trade rules mirror the above with signs flipped. One notable addition: shorting has unique risk
(fast squeezes upward, etc.), so we might be a bit more conservative with initiating shorts – e.g. require a
clearly confirmed downtrend across indicators and perhaps avoid shorts if overall market regime is bullish.
That said, if a unicorn short appears (say on a weak stock in a bearish market) we will take it with similar risk
management.
Overall, these rules ensure every trade is grounded in multiple confirmations, sized appropriately, and
protected by stops. The AI agent’s job is to  execute these consistently: check conditions, output the
structured JSON with action (order/notify/pass), and reasoning.
End-to-End Workflow with n8n Automation
To tie everything together, we’ll use n8n (a workflow automation tool) as the glue between TradingView,
our AI “brain”, the broker, and notifications. Here’s how the data and control will flow:
TradingView Alerts: We will set up TradingView to send a webhook alert whenever our Pine script
conditions are met (or on every bar, filtered by conditions). The Pine script “Unicorn Engine (Scaffold)”
provided will output a JSON payload containing all relevant fields: symbol, timeframe, direction
(LONG, SHORT or NONE), price, indicator states (satycloud up/down, saty level value,
ripster_cloud state, squeeze_state, ichimoku trend, ATR, and any pre-calculated sl/tp and
unicorn_score)【user-provided JSON】. For example, an alert might look like: 
{
"symbol":"SPY",
"time":"2025-11-05T14:30:00Z",
"tf":"15",
• 
• 
1. 
13

"dir":"LONG",
"price": 400.50,
"satycloud":"up",
"satylevel": 399.8,
"ripster_cloud":"bull",
"squeeze_state": 1,
"ichimoku_trend":"bull",
"atr": 1.20,
"sl": 398.70,
"tp": 403.90,
"unicorn_score": 0.8
}
This says: on SPY 15-min, conditions favored a LONG, with various indicators bullish, Pine estimated SL and
TP, and a unicorn_score 0.8 (which might correspond to 80 in our internal scale).
n8n Webhook (Ingest): We configure an n8n workflow with an HTTP Webhook node to catch these
alerts. TradingView will POST the JSON to n8n. We will secure it (e.g. with an HMAC or a token in the
URL) to ensure authenticity. Once n8n receives it, it passes the data to the next steps.
LLM Agent (Decision Maker):  The core of the workflow is an  OpenAI (GPT-4) node  using a
Structured Output parser. We will prompt it with a carefully crafted system prompt (the “TV-Copilot”
persona described) which instructs it on how to interpret the data and apply our rules. The prompt
will include:
The goals and logic described in the Trade Rules above (in summary form), 
The list of tools or functions it can output (like risk_calc, db_log, etc., though in practice these
might just be implied actions since n8n will handle actual logging or order placement),
The JSON schema it must adhere to for output (provided in the user’s spec). This schema has fields: 
action (order/notify/pass), side (BUY/SELL or null), qty , entryRef (reference price), sl , 
tp , timeInForce, notes (for any extra info or debugging).
The LLM will get the JSON alert data and produce a JSON decision. For example, for the above alert, the LLM
might output: 
{
"action":"order",
"side":"BUY",
"qty": 250,
"entryRef": 400.5,
"sl": 398.7,
"tp": 403.9,
"timeInForce":"GTC",
"notes": {
"unicorn_score": 0.8,
"comment":"Bullish confluence: Saty cloud up, Ripster bull, squeeze fired 
1. 
2. 
3. 
4. 
5. 
14

long. Placing long trade."
}
}
This indicates: go ahead and place a buy order of 250 shares (as calculated from risk and stop distance), use
given entry price as reference (the actual execution might be at market or a limit), and set the stop-loss and
take-profit accordingly. The agent also logs a brief explanation in notes. The action could also be 
"notify" if it decided not to trade but to just alert (perhaps if risk limits are hit or if dir  was NONE but
it still wants to say something), or "pass" if it determined the alert is not actionable (e.g. dir: NONE or
data incomplete).
The structured output parser ensures the LLM cannot deviate from the JSON format, making it reliable to
downstream systems. 
Conditional Logic in n8n: The workflow will have a Switch or IF node to branch based on action. 
If action == "order": it triggers the Broker API node (or a webhook to our trading platform).
For our prototype, we might integrate with Alpaca API for paper trading (as specified,
broker=Alpaca in paper mode).
If action == "notify": it triggers a Discord/Telegram notification node, sending the contents
of the decision (perhaps formatted nicely with symbol, decision, and the notes.explain from the
agent).
If action == "pass": we simply end the flow or log it without doing anything (could still notify if
we want to know passes for debugging).
On an order action, the agent provides side, qty, etc., so we know exactly what to send to the broker. We
will implement a bracket order – i.e., an entry (market or limit) with attached stop-loss and take-profit. If
using Alpaca, we can submit an OCO (one-cancels-other) bracket. The timeInForce likely “GTC” (good till
cancel) as we want the order to remain (or “DAY” if we just want to day trade and close EOD). Initially, we’ll
do paper trading to test it out, ensuring the orders execute as expected.
Additionally, we incorporate our risk guardrails at this stage: we may maintain a running tally of daily P/L
in the n8n workflow context or a simple database. If an incoming signal would violate the daily loss limit or
if already 3 trades are open and we disallow more, the LLM agent can decide  pass  (the prompt will
instruct it to do so if certain risk variables are set). Alternatively, a prior node in n8n could check a stored
variable “tradesToday” or “openRisk” and skip the LLM entirely if limits are hit (to avoid even attempting
trades). But using the LLM to enforce allows flexibility via its reasoning (“if missing fields or risk high: action
pass”).
Logging and Monitoring: Each decision and trade will be logged. n8n can write to a database or
Google Sheet the details of each alert and what action was taken. This is crucial for later analysis
(calculating how our unicorn signals performed, and for debugging the agent’s decisions). We’ll log
fields like timestamp, symbol, action, decision reasoning, and P/L when closed (we can update the
log upon receiving fill events from broker).
Feedback Loop:  The output of trades (profit, loss, etc.) can eventually be fed back to refine the
agent. For example, if a trade hits stop, we can tag that occurrence of conditions as a failure in our
1. 
2. 
3. 
4. 
1. 
2. 
15

dataset. Over time, as we gather many samples, we might adjust the scoring or even train a simple
model or use the LLM in analysis mode to find patterns in successes vs failures.
The entire pipeline creates an “AI trading co-pilot” – it’s deterministic in execution (follows rules, outputs
structured data), but uses the intelligence of an LLM to interpret nuanced combinations of signals and
make judgment calls (something traditionally done with rigid code, but here we leverage the LLM’s flexibility
with our prompt constraints). The structured schema ensures we don’t get any unpredictable output – only
valid JSON that our system can act on.
We will run this workflow on an n8n instance (could be self-hosted or cloud). The WordPress dashboard
(described next) will display the live signals and trades, giving the user insight and control.
Web Interface (iava.ai) Integration
We want a user-friendly way to monitor signals and performance, and possibly toggle settings, via our
website iava.ai (currently WordPress with cPanel access). We have a couple of approaches:
Option A: WordPress Plugin Endpoint + Dashboard Shortcode. In this approach, we keep things simple
within WordPress: - We create a small REST API endpoint in WordPress by writing a custom plugin (as
given in the plan snippet). This endpoint (e.g.  /wp-json/iava/v1/signal) will accept POST requests
(from n8n) containing summary of signals or trades. We’ll include perhaps symbol, action, entry price, P/L, a
short explanation, etc. - The plugin can store received data in the WordPress database, even just using
update_option for a last signal or appending to a custom table for history. - We then build a dashboard
page on iava.ai that uses a shortcode to display the latest signals/trades. This could simply fetch the stored
data (via an AJAX call to that same REST endpoint or by directly reading the option). We can format it nicely
with HTML/CSS: e.g. a table of recent signals with color-coding for wins/losses, current open trades, etc. -
Security: the endpoint will be open (permission_callback returns true in the snippet for simplicity).
We rely on obscurity or better, include a secret key in the n8n POST header for verification.
This is a quick way to get a view. The downside is it’s somewhat limited in interactivity (mostly one-way
display). But it’s fast to implement. The user mentioned “mock the website and everything should be planned
and ready to go” – so we will indeed produce at least a mock-up of what the dashboard would show: likely a
list of unicorn signals with timestamp, and perhaps stats like win rate.
Option B: Separate App (Node/React) Embedded via iFrame or Subdomain.  If we need a richer UI
(charts, interactivity), we could develop a small web app. For example, a lightweight FastAPI or Node.js
server running under our cPanel (maybe via Docker or as a separate service) that serves a React frontend.
This app could subscribe to the same n8n data (n8n can send data to both WordPress and this app’s API).
The React UI might show live charts or allow toggling the strategy on/off. We could embed it in WordPress
either via an  <iframe>  or possibly as a WP plugin using the REST API of that service. This is more
complex, so unless needed, Option A is preferable initially.
Given time constraints, we likely proceed with Option A to have something working. We’ll implement the
provided plugin snippet (which essentially registers an endpoint and saves the payload to an option).
We’ll have n8n send a POST to it at each trade decision (or maybe only when action != pass, to avoid
73
73
16

flooding it with non-signals). The website can then show the most recent signal and perhaps a log of the
last N signals.
Possible Dashboard Elements: -  Live Signal Feed: e.g. “Nov 5 10:30 – BUY AAPL @ 150, SL 148, TP 153
(Unicorn Score 0.75)” with maybe a status (open/closed) and outcome if closed. - Statistics: overall win rate,
total P/L (paper), average R, max drawdown so far, etc. These can be calculated if we store all trades. -
Controls: Perhaps buttons to change mode (paper/live) or pause the strategy. We can achieve a “pause” by
having the plugin or n8n check a flag from the site before executing trades. For instance, a WP option
“trading_active=true/false” that our agent checks (we can fetch it via WordPress REST from n8n at workflow
start, or even include it in the prompt data). If user hits “Pause trading” on site (which sets the option false),
the next signals would result in action="notify" instead of order. This is a nice safety.
Since the user is excited to see the website working, we’ll make sure to integrate at least the display part
early (Milestone M5 in plan).
Risk Management & Safeguards
Risk control is paramount. We embed the following rules (some already touched upon):
Per-Trade Risk: By configuration, each trade risks only 0.25% to 1.0% of account equity (user can
adjust). We’ll likely default to 0.5%. This means even a string of losses won’t be devastating. It’s in line
with the classic 2% rule (often even more conservative).
Daily Loss Cap: If losses accumulate to ≥2% of equity in a day (could set 3% as hard cap), the
system stops trading for the remainder of the day. This prevents a bad day from snowballing.
Professional traders and prop firms use similar daily loss limits (e.g. Topstep and others auto-
liquidate if you hit a certain percent in a day). We will implement this by monitoring running P/L:
each closed trade’s loss adds to a counter. If counter ≤ -2% equity, the agent will ignore new signals
(action="pass" with note “Max daily loss reached”). It can reset at the next trading day.
Concurrent Trades & Correlation: We limit the number of simultaneous open trades such that
total potential risk ≤ ~1.5-2% of equity. If each trade is 0.5% risk, we might allow up to 3-4
concurrent trades at most. The agent will keep track (n8n can store in global memory or check open
orders via broker API). If we already have, say, 3 trades open and a fourth signal comes, the agent
might either pass or notify instead of auto-entry, unless that new signal is extraordinarily high
confidence. Another tactic: allow additional trades only if they are in different assets that are not
highly correlated. If our first 3 trades are all tech stocks long, adding a 4th tech long increases
exposure. But a signal on an unrelated asset (like gold or a different sector) might be fine. For now,
we can implement a simple numeric limit and perhaps a sector check if data available.
Major News/Events Filter: As mentioned, we ideally integrate a way to avoid trading during major
scheduled events (Fed meetings, big earnings if trading stocks, etc.), when whipsaws can occur. The
simplest approach is manual – user can flip “halt” on site. Or maintain a calendar and have the agent
automatically pause around those times. This is an optional enhancement; initially, we might rely on
user discretion or trade smaller size on those days.
• 
74
• 
75
76
• 
• 
17

Transition from Paper to Live: We plan a phased rollout:
Paper Trading (M2-M4 milestones): Use Alpaca paper or similar, get comfortable with performance.
Dry-Run Live (Simulated with auto-cancel): Possibly a mode where orders are sent to live broker
but immediately canceled, just to test execution flow without actual fills (or use minimal size).
Live Trading Small Size: Only after thorough testing and maybe after achieving certain backtest/WF
metrics (PF ≥ 1.4, drawdown within limits, etc., as listed in Test Plan).
Always start with small position sizes in live (maybe risk 0.25%) and scale up if proven.
No AI Override of Rules: We clarify that while an LLM is making decisions, it’s constrained by our
rules – it won’t, for example, double down to “win back losses” or do anything not prescribed. It’s
basically executing a rules-based strategy in natural language form. All critical values (risk %,
thresholds) are hardcoded or config-driven, not left to AI “improvisation.”
We’ll also incorporate sanity checks: e.g. if the LLM for some reason outputs an order JSON that doesn’t
match the schema or has null fields it shouldn’t, n8n will detect that (via JSON schema validation) and can
fail-safe (perhaps notify developers). But since we use the structured parser, this risk is minimal.
By doing all this, we emulate professional risk practices: small consistent risk per trade, cut off bad days,
and limit exposure so no single event can wreck the account. This addresses the user’s “ultrathink” notion –
presumably using AI to automate these protective steps as well, which we have done.
Backtesting & Performance Evaluation (“Probability” Framework)
Before going fully live, we will conduct extensive backtesting and walk-forward analysis to validate and
tune the strategy: - We’ll test on multiple symbols (e.g. a couple of major stocks or ETFs, maybe ES futures)
across various market conditions:  trending bull, trending bear, volatile, sideways. This ensures the
strategy isn’t overfit to one regime. For example, test on 2020 (volatile crash + rebound), 2021 (steady
uptrend), 2022 (bearish/trending down), etc. - Key metrics: Expectancy (avg R per trade),  Win rate,  Profit
factor (gross profit/gross loss),  Max drawdown,  Sharpe ratio if applicable, Max consecutive losses, etc.
We aim for Profit Factor > 1.4, meaning the strategy makes at least $1.4 for every $1 lost – a sign of edge.
The Sharpe or Sortino on trade returns should be significantly positive. - We specifically look at distribution
of outcomes: are there fat-tail losses? (Shouldn’t be if stops always in place, but slippage can cause some).
How frequent are the unicorn signals? If too rare (like 2 per year), maybe we lower threshold; if too many,
maybe raise it. - Walk-forward optimization: Rather than one big optimization that can overfit, we can do a
rolling test – e.g. use data up to 2022 to optimize threshold, then test on 2023 out-of-sample. And even a
quasi-paper forward test in early 2024 data.
The “Probability framework” mentioned likely refers to how we compute the Unicorn score threshold. We
will likely: 1. Compute historical occurrences of various indicator alignments (co-occurrence frequency). 2.
Compute their average forward bars return (and maybe distribution). 3. From that, derive an  expected
value and probability of success for each combo. 4. Then choose a Score formula or threshold that yields
best risk-adjusted returns in simulation. Perhaps we might end up saying: only trade when at least 3 of 4
signals align (which might correspond to score ~0.7 in Pine’s output). This selection will be based on
maximizing something like Sharpe or minimizing drawdown while keeping decent CAGR.
• 
• 
• 
• 
• 
• 
18

Once that’s set, we lock the params and go live (paper/live).
We will also incorporate scenario-based testing: ensure the strategy handles edge cases (flat market –
likely no signals, news spike – possibly triggers a squeeze breakout that might be false, etc.). This is partly
manual analysis of historical trades our backtester flags.
The user’s milestones are: - M1: Research digest (this document) and parameter tables – we have described
typical parameters (ATR 14, triggers 0.236, EMAs sets, BB 20/2, KC 20/1.5, Ichimoku 9-26-52) in text. We can
summarize those in a quick reference table below for clarity. - M2: Pine scaffold on chart, sending alerts –
straightforward given we have the code. We’ll test it on TradingView with a few tickers. - M3: n8n agent +
schema + Discord – set up the automation pipeline; test that the AI produces correct JSON and that
messages/orders  go  through.  -  M4:  Calibrate  unicorn  detector  –  using  historical  data  to  adjust  the
unicorn_score threshold in Pine (or interpret it in agent). Possibly refine how Pine computes unicorn_score
(currently a placeholder sum of some conditions). - M5: WordPress dashboard live – implement the plugin,
verify signals log to site. - M6: Begin paper trading, then gradually move to live with small size after a trial
period.
We have a lot lined up, but step-by-step we’ll get there. The plan ensures by the end we have a  fully
operational AI-assisted trading system running (most likely on paper or small stakes to start).
Before concluding, let’s collate the typical parameters & rule candidates in one place for quick reference:
Indicator Parameters Quick Reference:
Saty ATR Levels: ATR Length 14; Trigger = 0.236 ATR; Mid = 0.618 ATR; Full Range = 1 ATR; Extensions at
1.236, 1.618 ATR etc. Modes: Day (uses daily ATR pivot), Swing (weekly ATR), etc. Trend based on
EMAs 8/21/34 alignment.
Saty Pivot Ribbon: EMAs 8, 21, 34 (3-EMA version) or plus 13, 48, 200 (5-EMA Pro). Bullish if
shorter EMAs above longer (ribbon green/blue). Key signal: ribbon “fold” (crossover) and 13/48
“conviction” cross arrows for trend changes.
Ripster EMA Clouds: Common EMA pairs: 5-12, 8-9, 20-21, 34-50. Use 10min for intraday, 1H/D
for swings. Golden rule: Price above 34-50 cloud = bullish bias, below = bearish. Fast cloud
flips (color changes) are entry signals; 34/50 cloud is master trend filter.
TTM Squeeze: BB 20,2; Keltner 20,1.5. Red dot = squeeze on (low vol); Green dot = squeeze
fired (vol expansion). Momentum oscillator 20-length default. Prefer trade on first green
dot with momentum bias (histogram >0 for long, <0 for short). Optional: require ≥3 red dots
(squeeze at least 3 bars) before acting.
Ichimoku: Standard periods 9 (Tenkan), 26 (Kijun), 52 (Span B), displacement 26. Bullish if
price above cloud (Span A > B); strong signal if Tenkan crosses up above Kijun above the cloud
. Chikou > price 26 bars ago = bullish confirmation (clear path). Common strategy: in
uptrend, buy on pullback when price dips below Kijun then regains Tenkan (opposite for
shorts).
Rule Candidates per Indicator:
Saty ATR Levels:Long: Price crosses above upper ATR trigger AND trend label = bullish. Use ATR
mid (0.618) and full (1.0) as targets; extension (1.618) as stretch target. Short: Price crosses below
• 
1
5
• 
7778
79
14
• 
1820
8018
• 
3334
343681
3536
41
• 
4748
53
5354
6162
• 
1
19

lower trigger, trend bearish. Exits: If price reaches full ATR (100% range) and stalls, consider taking
profit or tightening stop. If trend label flips (ATR EMA trend turns opposite), consider exit.
Pivot Ribbon/EMA Clouds:Long: Ribbon or cloud flips from bearish to bullish (e.g. 8 EMA crosses
above 21 EMA, cloud turns green) AND price is above 50 EMA. Add if price pulls back to 13 EMA
(overlap) in an uptrend to hold through trend. Short: Cloud flips red with price below, etc. Filter:
Only take signals in direction of 34/50 cloud trend for higher probability. Exit: If fast cloud flips
against you (loss of momentum) or price breaks through a major EMA (e.g. closes below 50 EMA in
long), exit.
TTM Squeeze:Entry (Long): After ≥1 red dot (squeeze), take long on first green dot if momentum
histogram is above 0 (indicating upward momentum). Alternate rule: Wait for 2 consecutive
green dots to confirm. Short: first green (off) dot with momentum <0. Exit: If after squeeze release,
you get 4-5 bars of move then momentum stalls (histogram ticks down), take profit. If squeeze fires
opposite to trade bias (e.g. you’re long and a new squeeze fires short), definitely exit.
Ichimoku:Long: Price closes above cloud and cloud ahead turns green (Span A > Span B) – a
breakout signal. Or, in existing uptrend, price dips to cloud or Kijun and then closes back above
Tenkan – a continuation entry. Require Chikou span not running into resistance (preferably
above past candles). Short: Price closes below cloud (cloud red) or bounces down off Kijun in
downtrend. Exit: Close when price closes back inside cloud (trend might be ending) or if Tenkan/
Kijun cross against your position.
Multi-indicator (Unicorn rules):Ideal Long: Bullish SATY trigger + bullish EMA cloud + Squeeze fired
long + Ichimoku bullish = enter aggressively (highest conviction). Moderate Long: If 2 agree and
others neutral (e.g. ATR trigger + squeeze fire but Ichimoku neutral) = can enter but maybe smaller
size or need other confirm like volume. Avoid Long: If one major component opposes (e.g. squeeze
fired long but Ichimoku cloud strongly bearish and thick overhead), probably a false signal – stand
aside or quick scalp only. Similar logic for shorts. Essentially, the more independent confirmations, the
better, and if conflicting signals, either no trade or wait until resolved.
With all the above in place, we have a comprehensive plan. The next steps will be implementation: building
the Pine script out fully, setting up the n8n flow with the structured LLM, testing, and iterating. The user
wanted to know “after doing the deep research what’s the steps for making this real life” – in summary:
Implementation Steps (Milestones):
Develop & Test Pine Script on TradingView (Milestone M2): Incorporate real calculations for Saty
ATR (or at least import the indicator), EMA clouds, TTM Squeeze, Ichimoku into the script. Plot them
and ensure the alertcondition fires correctly with the JSON. Test on a chart (e.g. SPY 5min) in
replay to see that alerts trigger as expected.
Set Up n8n and Integrations (M3):  Configure the webhook endpoint in n8n. Write the GPT-4
prompt with our rules. Input the JSON schema. Connect a dummy broker API (or just log to console
initially). Also connect a Discord webhook for notifications of decisions. Run a few manual test alerts
through (we can use n8n’s manual trigger with a copied JSON) to see if agent outputs correctly.
Tweak prompt as needed (ensuring it doesn’t hallucinate and strictly follows rules).
Calibrate Unicorn Threshold (M4): Using historical data (perhaps exporting indicator values from
Pine or by writing a Python backtester with similar logic), determine what unicorn_score corresponds
to good outcomes. Adjust Pine’s unicorn_score formula (currently a placeholder sum) to better
• 
24
82
18
• 
3536
• 
6162
83
• 
1. 
2. 
3. 
20

reflect rarity. Possibly replace it with a lookup table or a more mathematical combination. Aim that
unicorn_score ~0.7 is a sweet spot. Update prompt to use that value.
Dry Run End-to-End: Put TradingView on replay or live on a quiet market and generate a test alert
that goes through the whole pipeline to the paper broker (maybe use a small real market like a
crypto on weekend to test in realtime). Ensure the order gets placed, and stops/tp are set correctly.
Monitor Discord to confirm notifications come.
Implement WordPress Dashboard (M5): Deploy the custom plugin on iava.ai (we have cPanel/FTP).
Create a page “Dashboard” that uses a shortcode or custom template to show the last signal. For
start, maybe just display the last JSON or last few trades in a simple table. Style it minimally. In n8n,
add an HTTP node to POST the relevant info to  iava/v1/signal  after each decision. Test by
sending a sample. Then check the site.
Paper Trade and Iterate (M6 part1): Go live on paper trading during market hours. Let it run for a
week or two, collecting stats. Analyze performance: Are the signals triggering sensibly? Too many
false starts? Perhaps we’ll find we need to adjust sensitivity or add a condition (like maybe we got a
few trades where unicorn_score was borderline and they failed – we might decide to raise threshold
or incorporate volume filter). This is the time to fine-tune.
Go/No-Go   Decision   for   Live:  If   paper   results   are   promising   (PF,   win   rate   decent,   drawdown
acceptable), move to a small live account. Start with minimal size (maybe risk 0.25% or even fixed
100$ risk). Monitor closely for any discrepancies (live fills, slippage). Over another several weeks,
build confidence. If all good, gradually scale position size to intended level.
Throughout this journey, maintain close contact between the AI agent’s outputs and reality – if the AI ever
outputs something nonsensical, adjust the prompt or add rules to handle that scenario. For example, if the
agent says action: order but dir:NONE, that means our prompt logic missed something (we’ll ensure
the prompt explicitly says if dir == NONE then pass). We’ll also implement failsafes like if the AI doesn’t
respond in time (n8n can have a timeout), perhaps default to no action.
By the end, we expect a fully autonomous system that the user can watch via the website and tweak high-
level settings (like risk% or pause). The combination of our deep research and careful planning should give
the   user   a   state-of-the-art   trading   assistant   that   merges   multiple   technical   approaches   –   essentially
bringing “ultrathink” (ultra analysis) into automated trading.
Saty ATR Levels — Indicator by satymahajan — TradingView
https://www.tradingview.com/script/Ty6CMBw9-Saty-ATR-Levels/
Saty ATR Levels | PDF | Technical Analysis | Equity Securities
https://www.scribd.com/document/940198858/Saty-ATR-Levels
Frustrated and still trying to figure it out.... - useThinkScript Community
https://usethinkscript.com/threads/frustrated-and-still-trying-to-figure-it-out.15012/
Satyland - Saty Pivot Ribbon
https://www.satyland.com/pivotribbon
4. 
5. 
6. 
7. 
1278
3456
9
10111213141677787982
21

Satyland - Saty ATR Levels
https://www.satyland.com/atrlevels
Ripster EMA Clouds — Indicator by ripster47 — TradingView
https://www.tradingview.com/script/7LPOiiMN-Ripster-EMA-Clouds/
The EMA Cloud: The Next Generation Of Indicators?
https://www.chartlearning.com/2021/08/Ema-cloud-indicator-.html
Ripster Clouds Explained - RipsterEducation | PDF
https://www.scribd.com/document/820196555/Ripster-Clouds-Explained-RipsterEducation
TTM Squeeze | ChartSchool | StockCharts.com
https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-indicators/ttm-squeeze
Volatility Compression Momentum Breakout Tracking Strategy: Quantitative
Implementation of TTM Squeeze Indicator | by FMZQuant | Medium
https://medium.com/@FMZQuant/volatility-compression-momentum-breakout-tracking-strategy-quantitative-implementation-of-
ttm-dfe0232ccf51
Introduction to TTM Squeeze | TrendSpider Learning Center
https://trendspider.com/learning-center/introduction-to-ttm-squeeze/
How to Use the Squeeze Momentum Indicator to Time Trades
https://enlightenedstocktrading.com/squeeze-momentum-indicator/
Ichimoku Cloud Trading Strategies | ChartSchool | StockCharts.com
https://chartschool.stockcharts.com/table-of-contents/trading-strategies-and-models/trading-strategies/ichimoku-cloud-trading-
strategies
Understanding Ichimoku Cloud In Trading for
BINANCE:BTCUSDT by CandelaCharts — TradingView
https://www.tradingview.com/chart/BTCUSDT/spdL6bGc-Understanding-Ichimoku-Cloud-In-Trading/
Trading strategy: Ichimoku TKC - WH SelfInvest
https://www.whselfinvest.com/en/trading_strategies_17_Ichimoku_TKC.php
The Power Of Multiple Trading Signals In Confluence Zones - Trading Setups Review
https://www.tradingsetupsreview.com/power-multiple-trading-signals-confluence-zones/
Pointwise Mutual Information (PMI) - Empathy First Media
https://empathyfirstmedia.com/pointwise-mutual-information-pmi/
Super Signals
https://www.metastock.com/products/thirdparty/?3pc-add-ss
Using Stop-Loss and Take-Profit in ATAS
https://atas.net/atas-possibilities/using-stop-loss-and-take-profit-in-atas/
[PDF] Average True Range Indicator Trading Strategy [PDF] - HowToTrade
https://howtotrade.com/wp-content/uploads/2023/09/Average-True-Range.pdf
Satyland
https://www.satyland.com/
2% Rule in Investing: Manage Risk and Limit Losses with Examples
https://www.investopedia.com/terms/t/two-percent-rule.asp
15
1718243080
19202122232526272931
28
323334353637407081
383941434469
42
45
4647486162
49505152535455565758596383
60
6465
66
6768
71
72
73
74
22

Setting a Maximum Daily Loss When Day Trading (so a single day ...
https://tradethatswing.com/setting-a-daily-loss-limit-when-day-trading/?srsltid=AfmBOoqLJY7axzITGstB5gM-
KveInvAm0BIiRuEB64CLxet6HFbfTvQI
What is the Daily Loss Limit and what happens if I exceed it?
https://help.topstep.com/en/articles/8284207-what-is-the-daily-loss-limit-and-what-happens-if-i-exceed-it
75
76
23