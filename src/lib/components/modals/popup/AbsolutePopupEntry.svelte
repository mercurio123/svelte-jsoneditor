<script lang="ts">
  import type { AbsolutePopupOptions, PopupEntry } from '../../../types'
  import { onMount } from 'svelte'
  import { isChildOf } from '../../../utils/domUtils'
  import { keyComboFromEvent } from '../../../utils/keyBindings'

  export let popup: PopupEntry
  export let closeAbsolutePopup: (popupId: number) => void

  let refRootPopup
  let refHiddenInput

  onMount(focus)

  function closeWhenOutside(event) {
    if (
      popup.options &&
      popup.options.closeOnOuterClick &&
      !isChildOf(event.target, (e) => e === refRootPopup)
    ) {
      closeAbsolutePopup(popup.id)
    }
  }

  function handleWindowMouseDown(event) {
    closeWhenOutside(event)
  }

  function handleMouseDownInside(event) {
    event.stopPropagation()
  }

  function handleKeyDown(event) {
    const combo = keyComboFromEvent(event)
    if (combo === 'Escape') {
      closeAbsolutePopup(popup.id)
    }
  }

  function handleScrollWheel(event) {
    closeWhenOutside(event)
  }

  function calculateStyle(refRootPopup, options: AbsolutePopupOptions) {
    function calculatePosition() {
      if (options.anchor) {
        const { anchor, width = 0, height = 0, offsetTop = 0, offsetLeft = 0, position } = options
        const { left, top, bottom, right } = anchor.getBoundingClientRect()

        const positionAbove =
          position === 'top' || (top + height > window.innerHeight && top > height)
        const positionLeft =
          position === 'left' || (left + width > window.innerWidth && left > width)

        return {
          left: positionLeft ? right - offsetLeft : left + offsetLeft,
          top: positionAbove ? top - offsetTop : bottom + offsetTop,
          positionAbove,
          positionLeft
        }
      } else if (typeof options.left === 'number' && typeof options.top === 'number') {
        const { left, top, width = 0, height = 0 } = options

        const positionAbove = top + height > window.innerHeight && top > height
        const positionLeft = left + width > window.innerWidth && left > width

        return {
          left,
          top,
          positionAbove,
          positionLeft
        }
      } else {
        throw new Error('Invalid config: pass either "left" and "top", or pass "anchor"')
      }
    }

    const rootRect = refRootPopup.getBoundingClientRect()
    const { left, top, positionAbove, positionLeft } = calculatePosition()

    const verticalStyling = positionAbove
      ? `bottom: ${rootRect.top - top}px;`
      : `top: ${top - rootRect.top}px;`

    const horizontalStyling = positionLeft
      ? `right: ${rootRect.left - left}px;`
      : `left: ${left - rootRect.left}px;`

    return verticalStyling + horizontalStyling
  }

  function focus() {
    if (refHiddenInput) {
      refHiddenInput.focus()
    }
  }
</script>

<svelte:window
  on:mousedown|capture={handleWindowMouseDown}
  on:keydown|capture={handleKeyDown}
  on:wheel|capture={handleScrollWheel}
/>

<div
  bind:this={refRootPopup}
  class="jse-absolute-popup"
  on:mousedown={handleMouseDownInside}
  on:keydown={handleKeyDown}
>
  {#if refRootPopup}
    <div class="jse-absolute-popup-content" style={calculateStyle(refRootPopup, popup.options)}>
      <input
        type="text"
        readonly
        tabindex="-1"
        class="jse-hidden-input"
        bind:this={refHiddenInput}
      />
      <svelte:component this={popup.component} {...popup.props} />
    </div>
  {/if}
</div>

<style src="./AbsolutePopupEntry.scss"></style>
