<svelte:options immutable={true} />

<script lang="ts">
  import Icon from 'svelte-awesome'
  import type { MessageAction } from '../../types'
  import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'

  export let type: 'success' | 'error' = 'success' // 'success' or 'error'
  export let icon: IconDefinition = undefined
  export let message: string | undefined = undefined
  export let actions: MessageAction[] = []
  export let onClick: () => void | undefined = undefined

  function handleClick() {
    if (onClick) {
      onClick()
    }
  }
</script>

<div class="jse-message jse-{type}">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="jse-text" class:jse-clickable={!!onClick} on:click={handleClick}>
    {#if icon}
      <Icon data={icon} />
    {/if}
    {message}
  </div>
  <div class="jse-actions">
    {#each actions as action}
      <button
        type="button"
        on:click={() => {
          if (action.onClick) {
            action.onClick()
          }
        }}
        on:mousedown={() => {
          if (action.onMouseDown) {
            action.onMouseDown()
          }
        }}
        class="jse-button jse-action jse-primary"
        title={action.title}
        disabled={action.disabled}
      >
        {#if action.icon}
          <Icon data={action.icon} />
        {/if}
        {action.text}
      </button>
    {/each}
  </div>
</div>

<style src="./Message.scss"></style>
