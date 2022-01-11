import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useAtom } from 'jotai'
import { AlertTriangle, Info, largeIconCss, Spinner } from 'lib/icons'
import { Field, independentFieldAtom } from 'lib/state/swap'
import styled, { ThemedText, ThemeProvider } from 'lib/theme'
import { useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useDerivedSwapInfo } from 'state/swap/hooks'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'
import Tooltip from '../Tooltip'

function RoutingTooltip() {
  return (
    <Tooltip icon={Info} placement="bottom">
      <ThemeProvider>
        <ThemedText.Subhead2>TODO: Routing Tooltip</ThemedText.Subhead2>
      </ThemeProvider>
    </Tooltip>
  )
}

interface LoadedStateProps {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
}

function LoadedState({ inputAmount, outputAmount, trade }: LoadedStateProps) {
  const [flip, setFlip] = useState(true)
  const executionPrice = trade?.executionPrice
  const usdcValue = useUSDCPrice(inputAmount.currency)

  const ratio = useMemo(() => {
    const [a, b] = flip ? [outputAmount, inputAmount] : [inputAmount, outputAmount]

    const ratio = `1 ${a.currency.symbol} = ${executionPrice?.toSignificant(6)} ${b.currency.symbol}`
    const usdc = usdcValue ? ` ($${usdcValue.toSignificant(2)})` : null
    return (
      <Row gap={0.25} style={{ userSelect: 'text' }}>
        {ratio}
        {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
      </Row>
    )
  }, [executionPrice, flip, inputAmount, outputAmount, usdcValue])

  return (
    <TextButton color="primary" onClick={() => setFlip(!flip)}>
      {ratio}
    </TextButton>
  )
}

const ToolbarRow = styled(Row)`
  padding: 0.5em 0;
  ${largeIconCss}
`

export default function Toolbar({ disabled }: { disabled?: boolean }) {
  const [independentField] = useAtom(independentFieldAtom)
  const {
    trade,
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurency },
    currencyBalances: { [Field.INPUT]: balance },
    parsedAmounts: { [Field.INPUT]: inputAmount, [Field.OUTPUT]: outputAmount },
  } = useDerivedSwapInfo()

  const caption = useMemo(() => {
    if (disabled) {
      return (
        <>
          <AlertTriangle color="secondary" />
          <Trans>Connect wallet to swap</Trans>
        </>
      )
    }
    if (independentField === Field.INPUT ? inputCurrency && inputAmount : outputCurency && outputAmount) {
      if (!trade?.trade) {
        return (
          <>
            <Spinner color="secondary" />
            <Trans>Fetching best price…</Trans>
          </>
        )
      }
      if (inputAmount && balance && inputAmount.greaterThan(balance)) {
        return (
          <>
            <AlertTriangle color="secondary" />
            <Trans>Insufficient {inputCurrency?.symbol}</Trans>
          </>
        )
      }
      if (inputCurrency && inputAmount && outputCurency && outputAmount) {
        return (
          <>
            <RoutingTooltip />
            <LoadedState inputAmount={inputAmount} outputAmount={outputAmount} trade={trade?.trade} />
          </>
        )
      }
    }
    return (
      <>
        <Info color="secondary" />
        <Trans>Enter an amount</Trans>
      </>
    )
  }, [balance, disabled, independentField, inputAmount, inputCurrency, outputAmount, outputCurency, trade?.trade])

  return (
    <>
      <Rule />
      <ThemedText.Caption>
        <ToolbarRow justify="flex-start" gap={0.5} iconSize={4 / 3}>
          {caption}
        </ToolbarRow>
      </ThemedText.Caption>
    </>
  )
}
