categories = JSON.parse(categories_json);
const checkboxes = document.getElementsByClassName('category-checkbox');
for (let con in categories) {
  categories[con]['visible'] = true;
}
let totalVisible = 88;

const num_visible = document.getElementById('num-constelations-visible');

function togglePropertyVis(check_id, property, value) {
  let checked = document.getElementById(check_id).checked;
  for (let con in categories) {
    let con_value = categories[con][property];
    if (con_value == value) {
      if (checked) {
        changeVis(con, true);
      } else {
        changeVis(con, false);
      }
    }
  }
  updateNumVisibleDisplay();
}

function updateNumVisibleDisplay() {
  num_visible.innerHTML = totalVisible;
}

function changeVis(con, vis=true) {
  if (categories[con]['visible'] != vis) {
    categories[con]['visible'] = vis;
    if (vis) {
      totalVisible++;
      document.getElementById(con).classList.remove('d-none');
      document.getElementById(`${con}-nav`).classList.remove('d-none');
    } else {
      totalVisible--;
      document.getElementById(con).classList.add('d-none');
      document.getElementById(`${con}-nav`).classList.add('d-none');
    }
  }
}

function selectAll() {
  for (let elm of checkboxes) {
    elm.checked = true;
  }
  for (let con in categories) {
    changeVis(con, true);
  }
  updateNumVisibleDisplay();
}

function deselectAll() {
  for (let elm of checkboxes) {
    elm.checked = false;
  }
  for (let con in categories) {
    changeVis(con, false);
  }
  updateNumVisibleDisplay();
}
