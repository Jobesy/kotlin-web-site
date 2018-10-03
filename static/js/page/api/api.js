import $ from 'jquery'
import Dropdown from '../../com/dropdown'
import NavTree from '../../com/nav-tree'
import './api.scss'

const DEFAULT_VERSION = '1.3';
const LOCAL_STORAGE_KEY = 'targetApi';
const PLATFORM_AVAILABILITY = {
    'jvm': '1.0',
    'common': '1.1',
    'js': '1.1',
    'native': '1.3'
  };

function hideByTags($elements, state, checkTags, cls) {
  $elements.each((ind, element) => {
      const $element = $(element);
      $element.toggleClass(cls ? cls : 'hidden', !checkTags($element));
  });
}

function getMinVersion(a, b) {
  if (a > b) return b;
  return a;
}

function getTagPlatformName($tagElement) {
    return $tagElement
        .attr("class")
        .split(' ')
        .find((cls) => cls.startsWith('tag-value-'))
        .replace('tag-value-', '')
        .toLowerCase()
}

function updateState(state) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));


  const stateVersion = state.version ? state.version : DEFAULT_VERSION;
  const statePlatforms = state.platform.filter((platform) => PLATFORM_AVAILABILITY[platform] <= stateVersion);
  for (const platform in PLATFORM_AVAILABILITY) {
    const $toggleElement = $(".toggle-platform." + platform);
    $toggleElement.toggleClass("disabled", PLATFORM_AVAILABILITY[platform] > stateVersion)
  }
  const minVersion = statePlatforms.map((platform) => PLATFORM_AVAILABILITY[platform]).reduce(getMinVersion, '1.0');


  hideByTags($('[data-platform]'), state, ($element) => {
    const versions = $element.attr('data-kotlin-version')
        .toLowerCase()
        .split(", ");
    return $element.attr('data-platform')
        .toLowerCase()
        .split(", ")
        .filter((tag, index) => versions[index] <= stateVersion)
        .some((tag) => statePlatforms.includes(tag))
  });
  hideByTags($('.tags__tag.platform'), state, ($element) => {
    if ($element.attr('data-tag-version') > stateVersion) return false;

    return statePlatforms.includes(getTagPlatformName($element))
  });



  $(".tags").each(
    (index, element) => {

      const $element = $(element);
      console.log(element);
      const activeVersions =
          $.map($element.find(".tags__tag:not(.hidden)"), (versionContainer) => $(versionContainer).attr('data-tag-version'));
      if (activeVersions.length === 0) return;
      const minVersion = activeVersions.reduce(getMinVersion);

      $element.children(".kotlin-version").text(minVersion);
    }
  );

  hideByTags($('.tags__tag.kotlin-version'), state, ($element) => $element.text() > minVersion, 'hidden-version');
}

function addSelectToPanel(panelElement, title, config) {
  const selectElement = $(`<div class="api-panel__select"><span class="api-panel__dropdown-title">${title}</span></div>`);
  $(panelElement).append(selectElement);
  new Dropdown(selectElement, config);
}

function addPlatformSelectToPanel(panelElement, config) {
  const selectElement = $(`<div class="api-panel_toggle"></div>`);
  $.each(config.items, (value, item) => {
    const itemElement = $(`<div class="toggle-platform `+value+`"><span>`+item+`</span></div>`);
    selectElement.append(itemElement);
    if (!config.selected.includes(value)) {
      itemElement.addClass('off');
    }
    itemElement.click(() => {
      if (itemElement.hasClass('disabled')) return;
      itemElement.toggleClass('off');
      itemElement.addClass("pressed")
          .delay(200)
          .queue((next) => {
            itemElement.removeClass("pressed");
            next()
          });
      config.onSelect(value);
    });
  });
  $(panelElement).append(selectElement);

}

function initializeSelects() {
  const $breadcrumbs = $('.api-docs-breadcrumbs');
  if ($breadcrumbs.length > 0) {
    $breadcrumbs
      .wrap('<div class="api-page-panel"></div>')
      .before('<div class="api-panel__switchers"></div>');
  } else {
    $('.page-content').prepend('<div class="api-page-panel"><div class="api-panel__switchers"></div><div class="api-docs-breadcrumbs"></div></div>');
  }

  const switchersPanel = $('.api-panel__switchers')[0];

  const state = localStorage.getItem(LOCAL_STORAGE_KEY) ?
    JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) :
    {
      platform: 'all'
    };
  if (state.platform === 'all') {
    state.platform = ['common', 'jvm', 'js', 'native'];
  }
  updateState(state);

  addPlatformSelectToPanel(switchersPanel, {
    items: {
      'common': 'Common',
      'jvm': 'JVM',
      'js': 'JS',
      'native': 'Native'
    },
    selected: state.platform,
    onSelect: (platform) => {
      const index = state.platform.indexOf(platform);
      if (index !== -1) {
        state.platform.splice(index, 1);
      } else {
        state.platform.push(platform);
      }
      console.log(platform);
      console.log(state);
      
      updateState(state);
    }
  });


  addSelectToPanel(switchersPanel, "Version", {
    items: {
      '1.0': '1.0',
      '1.1': '1.1',
      '1.2': '1.2',
      '1.3': '1.3'
    },
    selected: state.version != null ? state.version : DEFAULT_VERSION,
    onSelect: (version) => {
      if(version !== DEFAULT_VERSION){
        state.version = version;
      } else {
        delete state.version;
      }

      updateState(state)
    }
  });

  updateState(state);
}

$(document).ready(() => {
  initializeSelects();
  new NavTree(document.querySelector('.js-side-tree-nav'));
});
